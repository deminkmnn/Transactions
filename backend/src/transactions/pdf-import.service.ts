import { BadRequestException, Injectable } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';
import { createHash } from 'crypto';
import { Account } from '../accounts/entities/account.entity';
import { categorizeByMcc } from '../common/mcc.util';
import { ParsedPdfTransaction } from './pdf-import.types';

@Injectable()
export class PdfImportService {
  async parse(buffer: Buffer, account: Account): Promise<{ period: string | null; transactions: ParsedPdfTransaction[] }> {
    const parser = new PDFParse({ data: buffer });

    try {
      const result = await parser.getText();
      const lines = result.text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => !/^-- \d+ of \d+ --$/.test(line));

      const periodLine = lines.find((line) => line.startsWith('Період:'));
      const period = periodLine ? periodLine.replace('Період:', '').trim() : null;

      const transactions: ParsedPdfTransaction[] = [];

      for (let i = 0; i < lines.length; i++) {
        if (!this.isDateLine(lines[i]) || !this.isTimeLine(lines[i + 1])) continue;

        const date = lines[i];
        const time = lines[i + 1];
        let cursor = i + 2;

        if (this.looksLikeMaskedCard(lines[cursor])) {
          cursor++;
        }

        const detailLines: string[] = [];
        let operationAmountRaw: string | null = null;
        while (cursor < lines.length) {
          if (this.isAmountLine(lines[cursor]) && this.isSummaryLine(lines[cursor + 1])) {
            operationAmountRaw = lines[cursor];
            break;
          }

          const inlineAmount = this.extractInlineAmount(lines[cursor], lines[cursor + 1]);
          if (inlineAmount) {
            if (inlineAmount.description) detailLines.push(inlineAmount.description);
            operationAmountRaw = inlineAmount.amount;
            break;
          }

          if (this.isDateLine(lines[cursor]) && this.isTimeLine(lines[cursor + 1])) {
            break;
          }

          if (!this.isNoiseLine(lines[cursor])) {
            detailLines.push(lines[cursor]);
          }
          cursor++;
        }

        if (cursor >= lines.length - 1) continue;
        if (!operationAmountRaw) continue;

        const operationAmount = this.parseAmount(operationAmountRaw);
        const summaryLineIndex = this.isAmountLine(lines[cursor]) ? cursor + 1 : cursor + 1;
        const summary = this.parseSummaryLine(lines[summaryLineIndex], account.currency || 'UAH');
        const description = this.normalizeDescription(detailLines);

        if (!description) continue;

        const transactionDate = this.parseTransactionDate(date, time);
        const externalId = this.buildExternalId(account.cardNumber, date, time, description, summary.balance, summary.cardAmount);

        transactions.push({
          externalId,
          cardNumber: account.cardNumber,
          type: summary.cardAmount >= 0 ? 'credit' : 'debit',
          amount: Math.abs(summary.cardAmount),
          currency: summary.accountCurrency,
          balance: summary.balance,
          description,
          category: categorizeByMcc(null, description),
          transactionDate,
          operationCurrency: summary.operationCurrency,
          operationAmount: Math.abs(operationAmount),
          commission: summary.commission,
          discount: summary.discount,
        });

        i = cursor + 1;
      }

      if (!transactions.length) {
        throw new BadRequestException('No transactions were detected in this PDF statement');
      }

      return { period, transactions };
    } finally {
      await parser.destroy();
    }
  }

  private buildExternalId(cardNumber: string, date: string, time: string, description: string, balance: number, amount: number) {
    return createHash('sha1')
      .update(`${cardNumber}|${date}|${time}|${description}|${balance}|${amount}`)
      .digest('hex');
  }

  private parseTransactionDate(date: string, time: string) {
    const [day, month, year] = date.split('.');
    return new Date(`${year}-${month}-${day}T${time}:00`);
  }

  private normalizeDescription(lines: string[]) {
    return lines
      .filter((line) => !/^Угода №/.test(line))
      .filter((line) => !/^від \d{2}\.\d{2}\.\d{4} р\./.test(line))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private parseSummaryLine(line: string | undefined, accountCurrency: string) {
    if (!line) {
      throw new BadRequestException('Malformed PDF statement: summary line is missing');
    }

    const operationCurrencyMatch = line.match(/^[A-Z]{3}/);
    const numbers = line.match(/[+-]?\d[\d\s]*,\d{2}/g) ?? [];

    if (!operationCurrencyMatch || numbers.length < 4) {
      throw new BadRequestException(`Malformed PDF statement summary: ${line}`);
    }

    return {
      operationCurrency: operationCurrencyMatch[0],
      cardAmount: this.parseAmount(numbers[0]),
      commission: this.parseAmount(numbers[1]),
      discount: this.parseAmount(numbers[2]),
      balance: this.parseAmount(numbers[3]),
      accountCurrency,
    };
  }

  private parseAmount(raw: string) {
    return Number(raw.replace(/\s/g, '').replace(',', '.'));
  }

  private extractInlineAmount(line: string | undefined, nextLine: string | undefined) {
    if (!line || !nextLine || !this.isSummaryLine(nextLine)) return null;

    const match = line.match(/^(.*?)([+-]?\d[\d\s]*,\d{2})$/);
    if (!match) return null;

    return {
      description: match[1].trim(),
      amount: match[2],
    };
  }

  private isDateLine(line?: string) {
    return !!line && /^\d{2}\.\d{2}\.\d{4}$/.test(line);
  }

  private isTimeLine(line?: string) {
    return !!line && /^\d{2}:\d{2}$/.test(line);
  }

  private looksLikeMaskedCard(line?: string) {
    return !!line && /\*{4,}/.test(line);
  }

  private isAmountLine(line?: string) {
    return !!line && /^[+-]?\d[\d\s]*,\d{2}$/.test(line);
  }

  private isSummaryLine(line?: string) {
    return !!line && /^[A-Z]{3}\s+[+-]?\d/.test(line) && (line.match(/[+-]?\d[\d\s]*,\d{2}/g)?.length ?? 0) >= 4;
  }

  private isNoiseLine(line?: string) {
    if (!line) return true;

    return [
      /^АКЦІОНЕРНЕ ТОВАРИСТВО/,
      /^Юридична адреса:/,
      /^Адреса для зв'язків/,
      /^Телефони:/,
      /^www\.pb\.ua/,
      /^25\.\d{2}\.\d{4}/,
      /^Сторінка \d+ з\d+/,
      /^Дата$/,
      /^операції$/,
      /^Картка \/ Рахунок$/,
      /^Деталі операції$/,
      /^Сума у$/,
      /^валюті$/,
      /^Сума$/,
      /^комісій$/,
      /^знижок$/,
      /^Залишок після$/,
      /^операції$/,
      /^Вклади гарантуються/,
      /^Інформація про кредитний ліміт/,
      /^Довідка видана/,
      /^Керівник Дирекції/,
      /^Сформовано системою/,
      /^Використання факсимільної/,
      /^Щоб переглянути/,
      /^1\. Зайдіть/,
      /^2\. Оберіть/,
      /^3\. Введіть/,
    ].some((pattern) => pattern.test(line));
  }
}
