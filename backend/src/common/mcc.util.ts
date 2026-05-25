import { TransactionCategory } from '../transactions/entities/transaction.entity';

/**
 * Визначає категорію транзакції по MCC коду та опису.
 * MCC довідник: https://en.wikipedia.org/wiki/Merchant_category_code
 */
export function categorizeByMcc(mcc: number | null, description: string): TransactionCategory {
  if (!mcc) return guessFromDescription(description);

  // Їжа та продукти
  if ([5411, 5412, 5422, 5441, 5451, 5462, 5499].includes(mcc)) return 'food';
  // Кафе та ресторани
  if ([5812, 5814, 5811, 5813].includes(mcc)) return 'cafe';
  // Транспорт
  if ([4111, 4112, 4121, 4131, 4784, 7523].includes(mcc)) return 'transport';
  // Пальне
  if ([5541, 5542, 5172].includes(mcc)) return 'fuel';
  // Здоров'я
  if ([5912, 5047, 5122, 8011, 8021, 8031, 8049, 8099, 8049].includes(mcc)) return 'health';
  // Розваги
  if ([7832, 7922, 7991, 7993, 7994, 7996, 7999].includes(mcc)) return 'entertainment';
  // Комунальні послуги
  if ([4900, 4911, 4941, 4961, 4974, 5983].includes(mcc)) return 'utilities';
  // Шопінг / одяг
  if (
    (mcc >= 5600 && mcc <= 5699) ||
    (mcc >= 5900 && mcc <= 5999) ||
    [5310, 5311, 5331, 5399, 5200, 5251].includes(mcc)
  ) return 'shopping';
  // Освіта
  if ([8200, 8211, 8220, 8241, 8244, 8249, 8299].includes(mcc)) return 'education';
  // Подорожі / готелі
  if (
    (mcc >= 3000 && mcc <= 3999) ||
    (mcc >= 4000 && mcc <= 4099) ||
    [7011, 7012].includes(mcc)
  ) return 'travel';
  // Перекази між рахунками
  if ([6011, 6012, 6051, 4829].includes(mcc)) return 'transfer';
  // Надходження / зарплата
  if (mcc === 6760) return 'income';

  return guessFromDescription(description);
}

function guessFromDescription(desc: string): TransactionCategory {
  const d = desc.toLowerCase();
  if (/atb|сільпо|novus|рукавичка|фора|billa|ашан|metro/.test(d)) return 'food';
  if (/mcdonald|kfc|pizza|піца|кафе|cafe|ресторан|sushi|суші|subway/.test(d)) return 'cafe';
  if (/uber|bolt|taxi|таксі|маршрутка|metro|метро|укрзаліз/.test(d)) return 'transport';
  if (/wog|okko|socar|shell|паливо|бензин/.test(d)) return 'fuel';
  if (/аптека|pharmacy|лікар|clinic|клінік/.test(d)) return 'health';
  if (/зарплата|зп|salary|нарахування|пенсія/.test(d)) return 'income';
  if (/переказ|transfer|від:|поповнення/.test(d)) return 'transfer';
  if (/netflix|steam|playstation|xbox|кино|кіно|cinema/.test(d)) return 'entertainment';
  if (/rozetka|алло|comfy|moyo|eldorado/.test(d)) return 'shopping';
  return 'other';
}
