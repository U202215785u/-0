// 食材营养数据库（每 100 克可食部的典型值，用于确定性估算）。
//
// 数值参考《中国食物成分表（第 6 版）》与美国 USDA FoodData Central 的常见食材
// 代表性数值，按家庭烹饪常见形态取值（生原料；煮熟主食换算见 rice/noodle 分派）。
// 本库数值是"典型参考值"，不是对任何特定批次食材的实验室测定结果。
//
// Profile 字段：
//   kcal/proteinG/carbsG/fatG …… 必填四项
//   fiberG/sugarG/saturatedFatG/sodiumMg … 扩展项（可选，缺失按 0 计）
//   density ……………………… 每毫升克数（用于 毫升/勺/杯/碗 等容积单位换算）
//   count ………………………… 计数单位（个/根/片/块…）或包装单位（盒/包/袋/罐/听/瓶/杯/碗）对应的克数
//   portion ……………………… 整只/整条动物的可食比例（去骨除壳），仅用于 只/条/尾 等单位
//   approx ………………………… 该条目为分类近似值（用于长尾食材，标记低置信度）

export type FoodProfile = {
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG?: number
  sugarG?: number
  saturatedFatG?: number
  sodiumMg?: number
  density?: number
  count?: Record<string, number>
  portion?: number
  approx?: boolean
  /** 标记为植物油类：参与估算时的炸制余油保留折算（避免整锅油计入一道菜） */
  oil?: true
}

export const foodProfiles: Record<string, FoodProfile> = {
  // —— 水、汤底 ——
  water: { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, density: 1, count: { 碗: 250, 小碗: 200, 大碗: 300, 杯: 240 } },
  broth: { kcal: 8, proteinG: 0.6, carbsG: 0.5, fatG: 0.4, sodiumMg: 120, density: 1, count: { 碗: 250 } },
  stock: { kcal: 8, proteinG: 0.6, carbsG: 0.5, fatG: 0.4, sodiumMg: 120, density: 1, count: { 碗: 250, 杯: 240 } },
  'chicken-stock': { kcal: 12, proteinG: 0.8, carbsG: 0.6, fatG: 0.7, sodiumMg: 300, density: 1, count: { 碗: 250 } },

  // —— 基础调味 ——
  salt: { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, sodiumMg: 38700, density: 1.2, count: { 茶匙: 6, 小勺: 6, 小匙: 6, 勺: 12, 撮: 1, 调料勺: 6 } },
  sugar: { kcal: 400, proteinG: 0, carbsG: 100, fatG: 0, sugarG: 100, sodiumMg: 1, density: 0.9, count: { 茶匙: 4.5, 小勺: 4.5, 小匙: 4.5, 勺: 9, 汤匙: 13.5, 大勺: 13.5, 大匙: 13.5, 碗: 200, 杯: 216 } },
  'rock-sugar': { kcal: 397, proteinG: 0, carbsG: 99, fatG: 0, sugarG: 99, density: 1.2, count: { 粒: 4, 块: 10, 小把: 20 } },
  'powdered-sugar': { kcal: 399, proteinG: 0, carbsG: 100, fatG: 0, sugarG: 100, density: 0.7, count: { 茶匙: 3.5, 小勺: 3.5 } },
  honey: { kcal: 320, proteinG: 0.4, carbsG: 79.5, fatG: 0, sugarG: 71, density: 1.42, count: { 汤匙: 21, 大勺: 21, 大匙: 21, 茶匙: 7, 小勺: 7, 小匙: 7 } },
  maltose: { kcal: 321, proteinG: 0.5, carbsG: 78, fatG: 0, sugarG: 55, density: 1.36 },
  msg: { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, sodiumMg: 12300, density: 0.8, count: { 茶匙: 4, 小勺: 4, 小匙: 4, 勺: 8 } },
  'chicken-powder': { kcal: 200, proteinG: 12, carbsG: 38, fatG: 1, sodiumMg: 18000, density: 0.9, count: { 茶匙: 4.5, 小勺: 4.5, 小匙: 4.5, 勺: 9, 汤匙: 13.5 } },
  'garlic-salt': { kcal: 45, proteinG: 0.5, carbsG: 8, fatG: 0.1, sodiumMg: 28000, density: 1.1 },
  'pepper-salt': { kcal: 240, proteinG: 6, carbsG: 45, fatG: 6, sodiumMg: 25000, density: 0.8 },
  vinegar: { kcal: 30, proteinG: 0.1, carbsG: 6, fatG: 0, sugarG: 2, sodiumMg: 20, density: 1.01 },
  'soy-sauce': { kcal: 63, proteinG: 5.6, carbsG: 10, fatG: 0.1, sugarG: 1, sodiumMg: 5493, density: 1.15, count: { 汤匙: 17, 大勺: 17, 大匙: 17, 茶匙: 6, 小勺: 6, 小匙: 6, 勺: 11.5, 白瓷勺: 17, 炒菜勺: 17 } },
  'dark-soy-sauce': { kcal: 60, proteinG: 4.5, carbsG: 11, fatG: 0.1, sugarG: 2, sodiumMg: 7800, density: 1.18, count: { 汤匙: 18, 大勺: 18, 大匙: 18, 茶匙: 6, 小勺: 6, 小匙: 6, 勺: 12, 白瓷勺: 18 } },
  'oyster-sauce': { kcal: 115, proteinG: 4, carbsG: 24, fatG: 0.5, sugarG: 14, sodiumMg: 5000, density: 1.25, count: { 汤匙: 19, 大勺: 19, 大匙: 19, 茶匙: 6, 小勺: 6, 小匙: 6, 勺: 12.5 } },
  doubanjiang: { kcal: 180, proteinG: 13, carbsG: 17, fatG: 6.5, sugarG: 3, sodiumMg: 6000, density: 1.2, count: { 汤匙: 18, 大勺: 18, 大匙: 18, 茶匙: 6, 小勺: 6, 勺: 12 } },
  'soybean-paste': { kcal: 130, proteinG: 12, carbsG: 18, fatG: 6, sugarG: 5, sodiumMg: 3600, density: 1.2, count: { 汤匙: 18, 大勺: 18, 茶匙: 6, 小勺: 6, 勺: 12 } },
  'sweet-bean-sauce': { kcal: 150, proteinG: 5, carbsG: 30, fatG: 1, sugarG: 15, sodiumMg: 3000, density: 1.2 },
  hoisin: { kcal: 220, proteinG: 4, carbsG: 50, fatG: 1.5, sugarG: 40, sodiumMg: 2500, density: 1.25, count: { 汤匙: 19, 大勺: 19, 大匙: 19, 茶匙: 6, 小勺: 6, 勺: 12.5 } },
  'char-siu-sauce': { kcal: 200, proteinG: 3, carbsG: 45, fatG: 1, sugarG: 38, sodiumMg: 1800, density: 1.25, count: { 汤匙: 19, 大勺: 19, 大匙: 19, 茶匙: 6, 勺: 12.5 } },
  ketchup: { kcal: 101, proteinG: 1.2, carbsG: 27, fatG: 0.1, sugarG: 22, sodiumMg: 907, density: 1.2, count: { 汤匙: 18, 大勺: 18, 大匙: 18, 茶匙: 6 } },
  'tomato-paste': { kcal: 100, proteinG: 2, carbsG: 22, fatG: 0.5, sugarG: 15, sodiumMg: 500, density: 1.15 },
  'tomato-sauce': { kcal: 40, proteinG: 1, carbsG: 9, fatG: 0.2, sugarG: 6, sodiumMg: 550, density: 1.1 },
  'chili-sauce': { kcal: 100, proteinG: 2, carbsG: 20, fatG: 1, sugarG: 10, sodiumMg: 3000, density: 1.12, count: { 汤匙: 17, 大勺: 17, 茶匙: 6 } },
  'chili-paste': { kcal: 120, proteinG: 3, carbsG: 22, fatG: 2, sugarG: 8, sodiumMg: 3800, density: 1.15, count: { 汤匙: 17, 大勺: 17, 大匙: 17, 茶匙: 6 } },
  mayonnaise: { kcal: 680, proteinG: 1, carbsG: 1.5, fatG: 75, sugarG: 1, saturatedFatG: 12, sodiumMg: 625, density: 0.92, count: { 汤匙: 14, 大勺: 14, 大匙: 14, 茶匙: 5 } },
  'sesame-paste': { kcal: 595, proteinG: 18, carbsG: 15, fatG: 52, sugarG: 1, fiberG: 5, saturatedFatG: 7, sodiumMg: 40, density: 1.05, count: { 汤匙: 16, 大勺: 16, 茶匙: 5, 小勺: 5 } },
  'fish-sauce': { kcal: 55, proteinG: 10, carbsG: 4, fatG: 0, sugarG: 2, sodiumMg: 7300, density: 1.15, count: { 汤匙: 17, 大勺: 17, 大匙: 17, 茶匙: 6, 小勺: 6, 勺: 11.5 } },
  'fermented-tofu': { kcal: 130, proteinG: 11, carbsG: 5, fatG: 8, sugarG: 1, sodiumMg: 2400, count: { 块: 15 } },
  douchi: { kcal: 250, proteinG: 24, carbsG: 25, fatG: 8, sodiumMg: 2600, count: { 小勺: 3, 小匙: 3, 茶匙: 3, 勺: 5 } },

  // —— 油、脂、奶制品 ——
  'cooking-oil': { kcal: 884, proteinG: 0, carbsG: 0, fatG: 100, saturatedFatG: 15, density: 0.92, oil: true, count: { 汤匙: 13.8, 大勺: 13.8, 大匙: 13.8, 茶匙: 4.6, 小勺: 4.6, 小匙: 4.6, 勺: 9.2, 白瓷勺: 13.8, 炒菜勺: 13.8, 碗: 180, 杯: 220, 滴: 0.05 } },
  'olive-oil': { kcal: 884, proteinG: 0, carbsG: 0, fatG: 100, saturatedFatG: 14, density: 0.92, oil: true, count: { 汤匙: 13.8, 大勺: 13.8, 大匙: 13.8, 茶匙: 4.6, 小勺: 4.6, 小匙: 4.6, 勺: 9.2 } },
  'sesame-oil': { kcal: 884, proteinG: 0, carbsG: 0, fatG: 100, saturatedFatG: 15, density: 0.92, count: { 汤匙: 13.8, 大勺: 13.8, 大匙: 13.8, 茶匙: 4.6, 小勺: 4.6, 小匙: 4.6, 勺: 9.2, 滴: 0.05 } },
  'chili-oil': { kcal: 884, proteinG: 0, carbsG: 0, fatG: 100, saturatedFatG: 15, density: 0.92, oil: true, count: { 汤匙: 13.8, 大勺: 13.8, 大匙: 13.8, 茶匙: 4.6, 小勺: 4.6, 勺: 9.2 } },
  lard: { kcal: 890, proteinG: 0, carbsG: 0, fatG: 100, saturatedFatG: 40, density: 0.9, oil: true, count: { 汤匙: 13.5, 大勺: 13.5, 勺: 9 } },
  butter: { kcal: 717, proteinG: 0.9, carbsG: 0.1, fatG: 81, saturatedFatG: 51, sodiumMg: 600, density: 0.91, count: { 汤匙: 13.6, 大勺: 13.6, 大匙: 13.6, 茶匙: 4.5, 小勺: 4.5, 小块: 15, 勺: 9 } },
  milk: { kcal: 61, proteinG: 3.2, carbsG: 4.8, fatG: 3.3, sugarG: 4.8, saturatedFatG: 1.9, sodiumMg: 44, density: 1.03, count: { 包: 258, 盒: 258, 袋: 258, 杯: 247, 碗: 258 } },
  'milk-powder': { kcal: 500, proteinG: 26, carbsG: 39, fatG: 27, sugarG: 39, saturatedFatG: 17, sodiumMg: 350, density: 0.5, count: { 汤匙: 7.5, 大勺: 7.5, 大匙: 7.5, 茶匙: 2.5, 小勺: 2.5, 小匙: 2.5, 勺: 5 } },
  yogurt: { kcal: 60, proteinG: 3, carbsG: 6, fatG: 3, sugarG: 5, saturatedFatG: 1.9, sodiumMg: 45, density: 1.04, count: { 盒: 130, 杯: 250 } },
  cream: { kcal: 340, proteinG: 2, carbsG: 3, fatG: 36, sugarG: 3, saturatedFatG: 22, sodiumMg: 40, density: 1, count: { 汤匙: 15, 大勺: 15, 大匙: 15, 茶匙: 5 } },
  'cream-cheese': { kcal: 342, proteinG: 6, carbsG: 4, fatG: 34, sugarG: 3, saturatedFatG: 21, sodiumMg: 320, density: 1.06, count: { 汤匙: 16, 大勺: 16, 茶匙: 5.3 } },
  mozzarella: { kcal: 280, proteinG: 22, carbsG: 3, fatG: 20, saturatedFatG: 12, sodiumMg: 620, count: { 片: 20, 把: 40 } },
  parmesan: { kcal: 430, proteinG: 38, carbsG: 4, fatG: 29, saturatedFatG: 18, sodiumMg: 1600, count: { 汤匙: 5, 茶匙: 2.5 } },
  cheese: { kcal: 350, proteinG: 23, carbsG: 2, fatG: 28, saturatedFatG: 18, sodiumMg: 700, density: 1.05, count: { 片: 20, 杯: 250, 小块: 20 } },
  'evaporated-milk': { kcal: 135, proteinG: 7, carbsG: 10, fatG: 8, sugarG: 10, saturatedFatG: 5, sodiumMg: 100, density: 1.06, count: { 听: 420, 盒: 200, 半听: 210 } },
  'coconut-milk': { kcal: 220, proteinG: 2, carbsG: 6, fatG: 22, sugarG: 2.5, saturatedFatG: 19, sodiumMg: 15, density: 1.04, count: { 听: 420, 盒: 200, 罐: 400 } },

  // —— 蛋类 ——
  egg: { kcal: 143, proteinG: 12.6, carbsG: 1.1, fatG: 9.5, sugarG: 1, saturatedFatG: 3.1, sodiumMg: 140, count: { 个: 50, 只: 50, 枚: 50 } },
  'egg-white': { kcal: 52, proteinG: 11, carbsG: 1, fatG: 0.2, sodiumMg: 155, count: { 个: 30, 只: 30, 枚: 30 } },
  'egg-yolk': { kcal: 322, proteinG: 15.8, carbsG: 3.9, fatG: 26.5, sugarG: 1, saturatedFatG: 9.5, sodiumMg: 50, count: { 个: 18, 只: 18, 枚: 18 } },
  'quail-egg': { kcal: 160, proteinG: 13, carbsG: 2.1, fatG: 11, saturatedFatG: 3.5, sodiumMg: 150, count: { 个: 10, 只: 10, 颗: 10 } },
  'century-egg': { kcal: 171, proteinG: 14, carbsG: 3, fatG: 12, saturatedFatG: 3.8, sodiumMg: 550, count: { 个: 60, 只: 60, 颗: 60 } },
  'salted-egg-yolk': { kcal: 422, proteinG: 14, carbsG: 3, fatG: 40, saturatedFatG: 12, sodiumMg: 1180, count: { 个: 15, 颗: 15, 只: 15 } },

  // —— 畜禽肉 ——
  pork: { kcal: 143, proteinG: 20.3, carbsG: 0, fatG: 6.2, saturatedFatG: 2.2, sodiumMg: 59, count: { 块: 150, 小块: 100 } },
  'ground-pork': { kcal: 220, proteinG: 17, carbsG: 0, fatG: 16, saturatedFatG: 6, sodiumMg: 70, count: { 碗: 150 } },
  'minced-pork': { kcal: 220, proteinG: 17, carbsG: 0, fatG: 16, saturatedFatG: 6, sodiumMg: 70, count: { 碗: 150 } },
  'pork-mince': { kcal: 220, proteinG: 17, carbsG: 0, fatG: 16, saturatedFatG: 6, sodiumMg: 70, count: { 碗: 150 } },
  'pork-belly': { kcal: 508, proteinG: 9.3, carbsG: 0, fatG: 53, saturatedFatG: 19, sodiumMg: 49, count: { 块: 300, 片: 30, 大片: 40 } },
  'pork-ribs': { kcal: 278, proteinG: 16.7, carbsG: 0, fatG: 23.1, saturatedFatG: 8.8, sodiumMg: 75, count: { 块: 60, 小块: 40 } },
  'pork-rib': { kcal: 278, proteinG: 16.7, carbsG: 0, fatG: 23.1, saturatedFatG: 8.8, sodiumMg: 75, count: { 块: 60 } },
  'pork-bones': { kcal: 200, proteinG: 15, carbsG: 0, fatG: 15, saturatedFatG: 5.5, sodiumMg: 90, count: { 根: 250, 块: 100 } },
  'pork-bone': { kcal: 200, proteinG: 15, carbsG: 0, fatG: 15, saturatedFatG: 5.5, sodiumMg: 90, count: { 根: 250 } },
  'pork-trotter': { kcal: 260, proteinG: 22, carbsG: 0, fatG: 18.6, saturatedFatG: 6.5, sodiumMg: 100, count: { 只: 350, 个: 350 }, portion: 0.7 },
  'pork-liver': { kcal: 129, proteinG: 19.3, carbsG: 5, fatG: 3.5, sodiumMg: 70, count: { 块: 150 } },
  'cured-pork': { kcal: 500, proteinG: 20, carbsG: 2, fatG: 48, saturatedFatG: 18, sodiumMg: 1900, count: { 小块: 40, 块: 60 } },
  'chinese-sausage': { kcal: 500, proteinG: 20, carbsG: 5, fatG: 40, saturatedFatG: 15, sodiumMg: 1200, count: { 根: 50, 条: 50 } },
  sausage: { kcal: 300, proteinG: 15, carbsG: 5, fatG: 25, saturatedFatG: 9, sodiumMg: 900, count: { 根: 80, 节: 40 } },
  ham: { kcal: 330, proteinG: 16, carbsG: 2, fatG: 28, saturatedFatG: 10, sodiumMg: 2300, count: { 大片: 25, 片: 15 } },
  bacon: { kcal: 393, proteinG: 13, carbsG: 2, fatG: 37, saturatedFatG: 14, sodiumMg: 1500, count: { 片: 12, 条: 15, 包: 200 } },
  beef: { kcal: 250, proteinG: 26, carbsG: 0, fatG: 15, saturatedFatG: 6, sodiumMg: 60, count: { 块: 200, 小块: 100 } },
  'beef-tenderloin': { kcal: 190, proteinG: 21, carbsG: 0, fatG: 8, saturatedFatG: 3.5, sodiumMg: 55 },
  lamb: { kcal: 203, proteinG: 19, carbsG: 0, fatG: 14, saturatedFatG: 6, sodiumMg: 70, count: { 块: 150 } },
  chicken: { kcal: 165, proteinG: 19, carbsG: 0, fatG: 9.5, saturatedFatG: 2.7, sodiumMg: 87, count: { 只: 1300, 个: 500, 块: 100, 份: 300 }, portion: 0.65 },
  'chicken-breast': { kcal: 118, proteinG: 23, carbsG: 0, fatG: 2.6, saturatedFatG: 0.7, sodiumMg: 74, count: { 块: 150, 小块: 100 } },
  'chicken-thigh': { kcal: 178, proteinG: 19, carbsG: 0, fatG: 11, saturatedFatG: 3, sodiumMg: 80, count: { 个: 160, 只: 160, 块: 150 } },
  'chicken-leg': { kcal: 178, proteinG: 19, carbsG: 0, fatG: 11, saturatedFatG: 3, sodiumMg: 80, count: { 个: 160, 只: 160 } },
  'chicken-wing': { kcal: 200, proteinG: 19, carbsG: 0, fatG: 13, saturatedFatG: 3.6, sodiumMg: 80, count: { 个: 45, 只: 45 } },
  'chicken-wings': { kcal: 200, proteinG: 19, carbsG: 0, fatG: 13, saturatedFatG: 3.6, sodiumMg: 80, count: { 个: 45, 只: 45 } },
  'chicken-feet': { kcal: 215, proteinG: 24, carbsG: 0, fatG: 14, saturatedFatG: 4, sodiumMg: 67, count: { 只: 40, 个: 40 } },
  'pork-intestine': { kcal: 190, proteinG: 13.6, carbsG: 0, fatG: 15, saturatedFatG: 5.5, sodiumMg: 150, count: { 根: 300, 副: 800 }, portion: 0.9 },
  duck: { kcal: 240, proteinG: 17, carbsG: 0, fatG: 19, saturatedFatG: 6, sodiumMg: 80, count: { 只: 1500, 个: 600, 块: 100, 份: 300 }, portion: 0.65 },
  'duck-leg': { kcal: 200, proteinG: 18, carbsG: 0, fatG: 14, saturatedFatG: 4.5, sodiumMg: 100, count: { 只: 250, 个: 250 } },

  // —— 水产 ——
  fish: { kcal: 110, proteinG: 19, carbsG: 0, fatG: 3.5, saturatedFatG: 0.7, sodiumMg: 57, count: { 条: 500, 尾: 400 }, portion: 0.62 },
  'grass-carp': { kcal: 110, proteinG: 17.7, carbsG: 0, fatG: 4.3, saturatedFatG: 0.9, sodiumMg: 53, count: { 条: 800 }, portion: 0.62 },
  'fish-head': { kcal: 105, proteinG: 17, carbsG: 0, fatG: 4, sodiumMg: 60, count: { 个: 400, 只: 300 }, portion: 0.6 },
  salmon: { kcal: 119, proteinG: 20, carbsG: 0, fatG: 4, saturatedFatG: 0.9, sodiumMg: 55 },
  shrimp: { kcal: 99, proteinG: 21, carbsG: 0.8, fatG: 1.2, saturatedFatG: 0.3, sodiumMg: 137, count: { 只: 10, 尾: 10, 个: 10 }, portion: 0.7 },
  'dried-shrimp': { kcal: 210, proteinG: 40, carbsG: 3, fatG: 3, sodiumMg: 4000, count: { 把: 5, 粒: 0.5 } },
  clam: { kcal: 77, proteinG: 10.9, carbsG: 2.6, fatG: 1.1, sodiumMg: 520, count: { 个: 8, 只: 8 }, portion: 0.3 },
  crab: { kcal: 95, proteinG: 18, carbsG: 1, fatG: 2, sodiumMg: 260, count: { 只: 300, 个: 300 }, portion: 0.55 },
  scallop: { kcal: 88, proteinG: 15.6, carbsG: 2.5, fatG: 0.8, sodiumMg: 190, count: { 个: 20, 只: 20, 粒: 5 } },
  squid: { kcal: 92, proteinG: 15.6, carbsG: 3.1, fatG: 1.4, sodiumMg: 2300, count: { 条: 300, 只: 300 }, portion: 0.85 },

  // —— 米面主食 ——
  rice: { kcal: 364, proteinG: 7.4, carbsG: 78, fatG: 0.6, fiberG: 0.8, sugarG: 0.1, sodiumMg: 1, count: { 碗: 150, 小碗: 120, 杯: 174 } },
  'cooked-rice': { kcal: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3, fiberG: 0.4, sugarG: 0.1, sodiumMg: 1, count: { 碗: 150, 小碗: 120, 大碗: 180, 杯: 156 } },
  'glutinous-rice': { kcal: 362, proteinG: 7, carbsG: 79, fatG: 0.8, fiberG: 1, sodiumMg: 2, count: { 碗: 150, 杯: 174 } },
  flour: { kcal: 364, proteinG: 11, carbsG: 76, fatG: 1.2, fiberG: 2.7, sugarG: 0.5, sodiumMg: 3, density: 0.55, count: { 杯: 132, 碗: 120 } },
  'bread-flour': { kcal: 360, proteinG: 12.5, carbsG: 72, fatG: 1.5, fiberG: 2.5, density: 0.58 },
  'cake-flour': { kcal: 350, proteinG: 8, carbsG: 79, fatG: 1, fiberG: 2, density: 0.5 },
  'glutinous-rice-flour': { kcal: 362, proteinG: 6.7, carbsG: 80, fatG: 1, fiberG: 1.4, density: 0.6, count: { 杯: 144 } },
  'rice-flour': { kcal: 365, proteinG: 6.5, carbsG: 80, fatG: 1, fiberG: 2, density: 0.6, count: { 杯: 144 } },
  'wheat-starch': { kcal: 340, proteinG: 0.3, carbsG: 83, fatG: 0.1, density: 0.55 },
  cornstarch: { kcal: 345, proteinG: 0.3, carbsG: 85, fatG: 0.1, sodiumMg: 10, density: 0.6, count: { 汤匙: 9, 大勺: 9, 茶匙: 3, 小勺: 3, 勺: 6 } },
  noodle: { kcal: 350, proteinG: 12, carbsG: 72, fatG: 1.5, fiberG: 3, sodiumMg: 150, count: { 碗: 150, 份: 100 } },
  'fresh-noodle': { kcal: 280, proteinG: 9, carbsG: 57, fatG: 1, fiberG: 1.5, sodiumMg: 100, count: { 碗: 180 } },
  pasta: { kcal: 350, proteinG: 12, carbsG: 72, fatG: 1.5, fiberG: 3, sodiumMg: 10 },
  vermicelli: { kcal: 341, proteinG: 0.8, carbsG: 83, fatG: 0.1, sodiumMg: 10, count: { 把: 40, 份: 60 } },
  bread: { kcal: 260, proteinG: 9, carbsG: 50, fatG: 3.5, sugarG: 5, fiberG: 4, sodiumMg: 400, count: { 片: 30, 张: 40 } },
  breadcrumbs: { kcal: 395, proteinG: 13, carbsG: 74, fatG: 5, fiberG: 3, sodiumMg: 600, count: { 碗: 90 } },
  yeast: { kcal: 105, proteinG: 12.5, carbsG: 18, fatG: 1.5, fiberG: 8, sodiumMg: 60, count: { 茶匙: 2.5, 小勺: 2.5, 小匙: 2.5 } },
  'baking-powder': { kcal: 100, proteinG: 0, carbsG: 24, fatG: 0, sodiumMg: 10400, density: 0.9, count: { 茶匙: 4.5, 小勺: 4.5, 小匙: 4.5 } },
  'baking-soda': { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, sodiumMg: 27000, density: 1.1, count: { 茶匙: 5.5, 小勺: 5.5, 小匙: 5.5 } },
  gelatin: { kcal: 330, proteinG: 84, carbsG: 0, fatG: 0, sodiumMg: 60, count: { 片: 5 } },

  // —— 蔬菜 ——
  'fennel-herb': { kcal: 32, proteinG: 2, carbsG: 6, fatG: 0.2, fiberG: 3, sugarG: 2 },
  'fennel-seed': { kcal: 345, proteinG: 16, carbsG: 52, fatG: 15, fiberG: 40, sodiumMg: 90, count: { 茶匙: 2.5, 颗: 0.1 } },
  carrot: { kcal: 41, proteinG: 0.9, carbsG: 9.6, fatG: 0.2, fiberG: 2.8, sugarG: 4.7, sodiumMg: 69, count: { 根: 110, 个: 120 } },
  radish: { kcal: 16, proteinG: 0.7, carbsG: 4, fatG: 0.1, fiberG: 1.6, sugarG: 1.9, sodiumMg: 21, count: { 个: 500, 只: 500, 条: 800 } },
  daikon: { kcal: 16, proteinG: 0.7, carbsG: 4, fatG: 0.1, fiberG: 1.6, sugarG: 1.9, sodiumMg: 21, count: { 个: 500, 条: 800 } },
  tomato: { kcal: 18, proteinG: 0.9, carbsG: 3.9, fatG: 0.2, fiberG: 1.2, sugarG: 2.6, sodiumMg: 5, count: { 个: 150, 只: 150 } },
  'cherry-tomato': { kcal: 22, proteinG: 1, carbsG: 4, fatG: 0.2, fiberG: 1.2, sugarG: 2.7, sodiumMg: 5, count: { 个: 15 } },
  potato: { kcal: 77, proteinG: 2, carbsG: 17, fatG: 0.1, fiberG: 2.2, sugarG: 0.8, sodiumMg: 6, count: { 个: 150, 颗: 130, 只: 130 } },
  'sweet-potato': { kcal: 86, proteinG: 1.6, carbsG: 20, fatG: 0.1, fiberG: 3, sugarG: 4.2, sodiumMg: 55, count: { 个: 200, 根: 200 } },
  'purple-sweet-potato': { kcal: 100, proteinG: 1.6, carbsG: 23, fatG: 0.2, fiberG: 3.2, sugarG: 5, sodiumMg: 10, count: { 个: 200 } },
  yam: { kcal: 57, proteinG: 1.9, carbsG: 13, fatG: 0.2, fiberG: 0.5, sugarG: 1, sodiumMg: 5, count: { 根: 300, 块: 60 } },
  taro: { kcal: 84, proteinG: 2.2, carbsG: 18, fatG: 0.2, fiberG: 1, sodiumMg: 9, count: { 个: 50 } },
  pumpkin: { kcal: 26, proteinG: 1, carbsG: 6.5, fatG: 0.1, fiberG: 0.5, sugarG: 2.8, sodiumMg: 1, count: { 个: 1500, 块: 100 } },
  'winter-melon': { kcal: 13, proteinG: 0.4, carbsG: 3, fatG: 0.1, fiberG: 0.7, sugarG: 1.5, sodiumMg: 1, count: { 个: 2000, 只: 2500, 块: 150 } },
  zucchini: { kcal: 17, proteinG: 1.2, carbsG: 3.1, fatG: 0.3, fiberG: 1, sugarG: 2.2, sodiumMg: 8, count: { 根: 300, 个: 300 } },
  cucumber: { kcal: 16, proteinG: 0.7, carbsG: 3.6, fatG: 0.1, fiberG: 0.5, sugarG: 1.7, sodiumMg: 2, count: { 根: 200, 条: 300, 个: 200 } },
  eggplant: { kcal: 25, proteinG: 1, carbsG: 5.9, fatG: 0.2, fiberG: 3, sugarG: 3.5, sodiumMg: 2, count: { 根: 150, 个: 200, 条: 150 } },
  broccoli: { kcal: 34, proteinG: 2.8, carbsG: 6.6, fatG: 0.4, fiberG: 2.6, sugarG: 1.7, sodiumMg: 33, count: { 棵: 300, 颗: 300 } },
  cauliflower: { kcal: 25, proteinG: 1.9, carbsG: 5, fatG: 0.3, fiberG: 2, sugarG: 1.9, sodiumMg: 30, count: { 朵: 300, 个: 500 } },
  cabbage: { kcal: 25, proteinG: 1.5, carbsG: 5.8, fatG: 0.1, fiberG: 2.5, sugarG: 3.2, sodiumMg: 18, count: { 颗: 1500, 个: 1000, 片: 30 } },
  'napa-cabbage': { kcal: 25, proteinG: 1.5, carbsG: 5.8, fatG: 0.1, fiberG: 2.5, sugarG: 3.2, sodiumMg: 18, count: { 颗: 1500, 个: 1000, 片: 30 } },
  'bok-choy': { kcal: 15, proteinG: 1.8, carbsG: 2.9, fatG: 0.2, fiberG: 1.2, sugarG: 1.2, sodiumMg: 65, count: { 棵: 150, 颗: 100 } },
  'baby-cabbage': { kcal: 13, proteinG: 1.5, carbsG: 2.4, fatG: 0.2, fiberG: 0.9, sodiumMg: 20, count: { 棵: 100, 颗: 100 } },
  lettuce: { kcal: 15, proteinG: 1.4, carbsG: 2.9, fatG: 0.2, fiberG: 1.3, sugarG: 0.8, sodiumMg: 28, count: { 片: 20, 张: 20, 颗: 300 } },
  celery: { kcal: 16, proteinG: 0.7, carbsG: 3.7, fatG: 0.2, fiberG: 1.6, sodiumMg: 80, count: { 根: 50, 棵: 300, 段: 30 } },
  celtuce: { kcal: 15, proteinG: 1, carbsG: 2.9, fatG: 0.1, fiberG: 0.9, sugarG: 1.2, sodiumMg: 45, count: { 根: 500 } },
  'lotus-root': { kcal: 74, proteinG: 1.9, carbsG: 17.2, fatG: 0.2, fiberG: 4.9, sugarG: 3, sodiumMg: 40, count: { 段: 200, 节: 200 } },
  'bamboo-shoot': { kcal: 27, proteinG: 2.6, carbsG: 5.2, fatG: 0.3, fiberG: 2.8, sugarG: 2, sodiumMg: 6, count: { 个: 250, 根: 150 } },
  asparagus: { kcal: 22, proteinG: 2.4, carbsG: 4, fatG: 0.2, fiberG: 2.1, sugarG: 1.3, sodiumMg: 2, count: { 把: 200, 根: 10 } },
  'green-bean': { kcal: 30, proteinG: 2, carbsG: 6, fatG: 0.2, fiberG: 2.7, sugarG: 2.4, sodiumMg: 8, count: { 根: 8, 把: 100 } },
  'snow-pea': { kcal: 42, proteinG: 2.8, carbsG: 7.6, fatG: 0.2, fiberG: 2.6, sodiumMg: 4, count: { 把: 100 } },
  pea: { kcal: 84, proteinG: 5.4, carbsG: 15, fatG: 0.4, fiberG: 5.7, sugarG: 5.7, sodiumMg: 5, count: { 把: 100 } },
  'green-peas': { kcal: 84, proteinG: 5.4, carbsG: 15, fatG: 0.4, fiberG: 5.7, sugarG: 5.7, sodiumMg: 5, count: { 把: 100 } },
  'bean-sprout': { kcal: 30, proteinG: 3, carbsG: 4, fatG: 0.2, fiberG: 1.6, sugarG: 2, sodiumMg: 6, count: { 把: 150 } },
  'bean-sprouts': { kcal: 30, proteinG: 3, carbsG: 4, fatG: 0.2, fiberG: 1.6, sugarG: 2, sodiumMg: 6, count: { 把: 150 } },
  'garlic-sprout': { kcal: 30, proteinG: 2.1, carbsG: 6.2, fatG: 0.4, fiberG: 1.8, sugarG: 2.8, sodiumMg: 10, count: { 根: 25, 把: 100 } },
  chives: { kcal: 28, proteinG: 2.5, carbsG: 5, fatG: 0.3, fiberG: 2.3, sugarG: 1.7, sodiumMg: 10, count: { 把: 120, 根: 3 } },
  cilantro: { kcal: 31, proteinG: 2.1, carbsG: 3.7, fatG: 0.5, fiberG: 2.8, sugarG: 0.9, sodiumMg: 45, count: { 棵: 15, 根: 5, 把: 80 } },
  parsley: { kcal: 36, proteinG: 3, carbsG: 6, fatG: 0.8, fiberG: 3.3, sugarG: 0.9, sodiumMg: 56, count: { 把: 60, 枝: 5, 棵: 15 } },
  mint: { kcal: 44, proteinG: 3.3, carbsG: 8.4, fatG: 0.7, fiberG: 8, sodiumMg: 30, count: { 株: 10, 朵: 2, 把: 50 } },
  basil: { kcal: 40, proteinG: 3.2, carbsG: 2.7, fatG: 0.6, fiberG: 2.5, sodiumMg: 5, count: { 枝: 5, 把: 50, 片: 0.5 } },
  onion: { kcal: 40, proteinG: 1.1, carbsG: 9.3, fatG: 0.1, fiberG: 1.7, sugarG: 4.2, sodiumMg: 4, count: { 个: 150, 颗: 100 } },
  shallot: { kcal: 30, proteinG: 2.5, carbsG: 6, fatG: 0.2, fiberG: 1.5, sugarG: 3, sodiumMg: 20, count: { 个: 15 } },
  garlic: { kcal: 149, proteinG: 6.4, carbsG: 33, fatG: 0.5, fiberG: 2.1, sugarG: 1, sodiumMg: 17, count: { 瓣: 5, 颗: 40, 头: 40 } },
  ginger: { kcal: 80, proteinG: 1.8, carbsG: 17.8, fatG: 0.8, fiberG: 2, sugarG: 1.7, sodiumMg: 13, count: { 块: 15, 小块: 10, 片: 3 } },
  scallion: { kcal: 30, proteinG: 1.6, carbsG: 6.5, fatG: 0.3, fiberG: 2.2, sugarG: 2.3, sodiumMg: 5, count: { 根: 30, 段: 15, 节: 10, 棵: 30, 小把: 30 } },
  'scallion-ginger': { kcal: 40, proteinG: 1.7, carbsG: 9, fatG: 0.4, fiberG: 2, sodiumMg: 8, count: { 小把: 20, 把: 40 } },
  'scallion-ginger-garlic': { kcal: 55, proteinG: 2.5, carbsG: 12, fatG: 0.5, fiberG: 2, sodiumMg: 10, count: { 小把: 20, 把: 40 } },
  aromatics: { kcal: 45, proteinG: 2, carbsG: 10, fatG: 0.4, fiberG: 2, sodiumMg: 9, count: { 小把: 20, 把: 40 } },
  'bitter-melon': { kcal: 22, proteinG: 1, carbsG: 4.3, fatG: 0.2, fiberG: 1.7, sugarG: 1.8, sodiumMg: 5, count: { 条: 350, 个: 250 } },
  'water-chestnut': { kcal: 74, proteinG: 1.4, carbsG: 18, fatG: 0.2, fiberG: 3, sugarG: 4, sodiumMg: 14, count: { 个: 15 } },
  corn: { kcal: 112, proteinG: 3.3, carbsG: 22, fatG: 1.4, fiberG: 2.4, sugarG: 4.7, sodiumMg: 3, count: { 根: 150, 条: 150, 个: 150 } },
  papaya: { kcal: 43, proteinG: 0.5, carbsG: 11, fatG: 0.3, fiberG: 1.7, sugarG: 7.8, sodiumMg: 8, count: { 个: 500, 只: 900 } },

  // —— 水果 ——
  lemon: { kcal: 29, proteinG: 1.1, carbsG: 9.3, fatG: 0.3, fiberG: 2.8, sugarG: 2.5, sodiumMg: 2, count: { 个: 100, 片: 8 } },
  'lemon-juice': { kcal: 25, proteinG: 0.4, carbsG: 8, fatG: 0.3, sugarG: 2.5, sodiumMg: 1, density: 1, count: { 滴: 0.05 } },
  lime: { kcal: 30, proteinG: 0.7, carbsG: 11, fatG: 0.2, fiberG: 3, sugarG: 1.7, sodiumMg: 2, count: { 个: 90 } },
  orange: { kcal: 47, proteinG: 0.9, carbsG: 11.8, fatG: 0.1, fiberG: 2.4, sugarG: 9.4, sodiumMg: 0, count: { 个: 150, 只: 150 } },
  apple: { kcal: 52, proteinG: 0.3, carbsG: 13.8, fatG: 0.2, fiberG: 2.4, sugarG: 10.4, sodiumMg: 1, count: { 个: 180, 只: 180 } },
  pear: { kcal: 57, proteinG: 0.4, carbsG: 15.2, fatG: 0.1, fiberG: 3.1, sugarG: 9.8, sodiumMg: 1, count: { 个: 170 } },
  mango: { kcal: 60, proteinG: 0.8, carbsG: 15, fatG: 0.4, fiberG: 1.6, sugarG: 13.7, sodiumMg: 1, count: { 个: 250 } },
  pineapple: { kcal: 50, proteinG: 0.5, carbsG: 13.1, fatG: 0.1, fiberG: 1.4, sugarG: 9.9, sodiumMg: 1, count: { 只: 1200, 个: 1000, 块: 100 }, portion: 0.55 },
  strawberry: { kcal: 32, proteinG: 0.7, carbsG: 7.7, fatG: 0.3, fiberG: 2, sugarG: 4.9, sodiumMg: 1, count: { 个: 15 } },
  hawthorn: { kcal: 100, proteinG: 0.5, carbsG: 25, fatG: 0.3, fiberG: 3, sugarG: 17, sodiumMg: 4, count: { 粒: 8, 个: 8, 颗: 8 } },
  'hawthorn-dried': { kcal: 260, proteinG: 3, carbsG: 64, fatG: 0.5, fiberG: 8, sugarG: 45, sodiumMg: 20, count: { 粒: 2, 把: 25 } },
  'chive-flower': { kcal: 40, proteinG: 3, carbsG: 6, fatG: 0.4, fiberG: 2, sugarG: 2, sodiumMg: 10, count: { 袋: 200, 把: 120 } },
  cola: { kcal: 42, proteinG: 0, carbsG: 10.6, fatG: 0, sugarG: 10.6, sodiumMg: 4, density: 1.03, count: { 罐: 330, 听: 330, 瓶: 500 } },
  'braising-liquid': { kcal: 40, proteinG: 2, carbsG: 6, fatG: 0.5, sugarG: 3, sodiumMg: 1200, density: 1.03, count: { 碗: 250, 锅: 1200 } },
  baizhi: { kcal: 300, proteinG: 10, carbsG: 60, fatG: 8, fiberG: 30, sodiumMg: 40 },
  'white-cardamom': { kcal: 310, proteinG: 8, carbsG: 55, fatG: 8, fiberG: 25, sodiumMg: 20 },
  caokou: { kcal: 310, proteinG: 8, carbsG: 55, fatG: 8, fiberG: 25, sodiumMg: 20 },
  sharen: { kcal: 300, proteinG: 9, carbsG: 58, fatG: 8, fiberG: 25, sodiumMg: 30 },
  chenpi: { kcal: 290, proteinG: 8, carbsG: 75, fatG: 1, fiberG: 35, sugarG: 50, sodiumMg: 300, count: { 片: 2 } },
  nutmeg: { kcal: 525, proteinG: 6, carbsG: 49, fatG: 36, fiberG: 21, sugarG: 28, sodiumMg: 16 },
  raisin: { kcal: 310, proteinG: 3, carbsG: 75, fatG: 0.5, fiberG: 4, sugarG: 70, sodiumMg: 8 },
  goji: { kcal: 349, proteinG: 13.9, carbsG: 64, fatG: 0.4, fiberG: 13, sugarG: 45, sodiumMg: 250, count: { 粒: 0.25, 颗: 0.25, 把: 8 } },
  'red-date': { kcal: 287, proteinG: 3.2, carbsG: 71, fatG: 0.5, fiberG: 6, sugarG: 57, sodiumMg: 6, count: { 个: 6, 颗: 6, 粒: 2 } },
  jujube: { kcal: 287, proteinG: 3.2, carbsG: 71, fatG: 0.5, fiberG: 6, sugarG: 57, sodiumMg: 6, count: { 个: 6, 颗: 6 } },
  'lotus-seed': { kcal: 350, proteinG: 17, carbsG: 63, fatG: 2, fiberG: 7, sugarG: 20, sodiumMg: 30, count: { 粒: 1.5, 颗: 1.5 } },
  coconut: { kcal: 660, proteinG: 6, carbsG: 23, fatG: 65, fiberG: 15, sugarG: 9, saturatedFatG: 60, sodiumMg: 30, count: { 汤匙: 4.5, 大勺: 4.5, 勺: 3 } },

  // —— 坚果、豆类 ——
  peanut: { kcal: 570, proteinG: 25, carbsG: 16, fatG: 44, fiberG: 8.5, sugarG: 4, saturatedFatG: 6.3, sodiumMg: 10, count: { 粒: 0.6, 把: 20 } },
  almond: { kcal: 580, proteinG: 21, carbsG: 22, fatG: 50, fiberG: 12, sugarG: 4, saturatedFatG: 4, sodiumMg: 1, count: { 颗: 1.2, 粒: 1.2, 把: 25 } },
  walnut: { kcal: 654, proteinG: 15, carbsG: 14, fatG: 65, fiberG: 7, sugarG: 2.6, saturatedFatG: 6.3, sodiumMg: 2, count: { 颗: 6, 粒: 6 } },
  cashew: { kcal: 560, proteinG: 18, carbsG: 30, fatG: 44, fiberG: 3.3, sugarG: 6, saturatedFatG: 8, sodiumMg: 12, count: { 颗: 1.2 } },
  sesame: { kcal: 590, proteinG: 19, carbsG: 12, fatG: 52, fiberG: 12, sugarG: 0.5, saturatedFatG: 7.3, sodiumMg: 11, density: 0.7, count: { 茶匙: 3.5, 小勺: 3.5, 小匙: 3.5, 汤匙: 10.5, 勺: 7 } },
  'black-sesame': { kcal: 570, proteinG: 18, carbsG: 14, fatG: 48, fiberG: 10, saturatedFatG: 7, sodiumMg: 15, density: 0.7, count: { 茶匙: 3.5, 小勺: 3.5 } },
  soybean: { kcal: 390, proteinG: 35, carbsG: 21, fatG: 16, fiberG: 15, sugarG: 7, saturatedFatG: 2.3, sodiumMg: 2, count: { 把: 25 } },
  'red-bean': { kcal: 325, proteinG: 20, carbsG: 63, fatG: 0.5, fiberG: 13, sugarG: 5, sodiumMg: 2, count: { 把: 80 } },
  'red-bean-paste': { kcal: 260, proteinG: 6, carbsG: 60, fatG: 1.5, sugarG: 45, fiberG: 4, sodiumMg: 30, density: 1.1 },

  // —— 豆制品 ——
  tofu: { kcal: 100, proteinG: 9, carbsG: 3, fatG: 6.5, fiberG: 0.5, sugarG: 0.6, saturatedFatG: 1, sodiumMg: 10, count: { 块: 300, 盒: 400, 小块: 150 } },
  'soft-tofu': { kcal: 62, proteinG: 5.7, carbsG: 2.4, fatG: 3.2, fiberG: 0.2, sodiumMg: 20, count: { 盒: 400, 块: 300 } },
  'dried-tofu': { kcal: 143, proteinG: 14.5, carbsG: 4, fatG: 7, fiberG: 1, sugarG: 1, sodiumMg: 300, count: { 块: 50, 条: 30, 根: 30, 半根: 15 } },
  'tofu-skin': { kcal: 250, proteinG: 24, carbsG: 12, fatG: 16, fiberG: 1, sugarG: 1, sodiumMg: 60, count: { 张: 40, 片: 20, 条: 15, 根: 10 } },
  'tofu-skin-dried': { kcal: 445, proteinG: 45, carbsG: 23, fatG: 22, fiberG: 1.5, sugarG: 1, sodiumMg: 50, count: { 根: 10, 条: 10 } },

  // —— 菌菇、藻类 ——
  mushroom: { kcal: 22, proteinG: 3.1, carbsG: 3.3, fatG: 0.3, fiberG: 1, sugarG: 1.7, sodiumMg: 15, count: { 个: 20, 只: 20 } },
  shiitake: { kcal: 34, proteinG: 2.2, carbsG: 6.8, fatG: 0.5, fiberG: 2.5, sugarG: 2.4, sodiumMg: 10, count: { 朵: 15, 个: 15 } },
  'dried-shiitake': { kcal: 290, proteinG: 20, carbsG: 63, fatG: 1.5, fiberG: 30, sugarG: 20, sodiumMg: 80, count: { 朵: 3, 个: 3 } },
  enoki: { kcal: 27, proteinG: 2.7, carbsG: 5.3, fatG: 0.3, fiberG: 4, sugarG: 2.3, sodiumMg: 3, count: { 把: 100, 包: 150 } },
  'king-oyster-mushroom': { kcal: 35, proteinG: 1.3, carbsG: 7, fatG: 0.2, fiberG: 2.3, sugarG: 3, sodiumMg: 4, count: { 根: 100, 个: 150 } },
  'wood-ear': { kcal: 25, proteinG: 1.5, carbsG: 6, fatG: 0.2, fiberG: 2.6, sugarG: 1, sodiumMg: 8, count: { 朵: 3, 把: 30 } },
  'seafood-mushroom': { kcal: 28, proteinG: 2.2, carbsG: 5.6, fatG: 0.2, fiberG: 3, sodiumMg: 3, count: { 把: 100 } },
  kelp: { kcal: 25, proteinG: 1.2, carbsG: 5, fatG: 0.2, fiberG: 3, sugarG: 1, sodiumMg: 280, count: { 把: 30 } },
  'kelp-dried': { kcal: 152, proteinG: 2.4, carbsG: 35, fatG: 0.5, fiberG: 12, sugarG: 3, sodiumMg: 1500, count: { 把: 20 } },
  nori: { kcal: 250, proteinG: 26, carbsG: 44, fatG: 1.5, fiberG: 21, sugarG: 2, sodiumMg: 900, count: { 张: 2, 片: 1 } },
  seaweed: { kcal: 25, proteinG: 1.2, carbsG: 5, fatG: 0.2, fiberG: 3, sodiumMg: 280, count: { 片: 2, 小片: 1, 把: 30 } },

  // —— 香料、干货 ——
  'white-pepper': { kcal: 350, proteinG: 10, carbsG: 65, fatG: 3, fiberG: 26, sugarG: 1, sodiumMg: 20, density: 0.5, count: { 茶匙: 2.5, 小勺: 2.5, 小匙: 2.5, 撮: 1 } },
  'black-pepper': { kcal: 350, proteinG: 10, carbsG: 65, fatG: 3, fiberG: 26, sugarG: 1, sodiumMg: 20, density: 0.5, count: { 茶匙: 2.5, 小勺: 2.5, 小匙: 2.5, 撮: 1 } },
  'chili-powder': { kcal: 280, proteinG: 14, carbsG: 50, fatG: 14, fiberG: 28, sugarG: 8, sodiumMg: 170, density: 0.55, count: { 汤匙: 8, 大勺: 8, 大匙: 8, 茶匙: 2.75, 小勺: 2.75, 小匙: 2.75, 勺: 5.5 } },
  'chili-flakes': { kcal: 280, proteinG: 14, carbsG: 50, fatG: 14, fiberG: 28, sugarG: 9, sodiumMg: 120, density: 0.45, count: { 汤匙: 7, 大勺: 7, 茶匙: 2.3 } },
  'dried-chili': { kcal: 280, proteinG: 17, carbsG: 52, fatG: 12, fiberG: 28, sugarG: 9, sodiumMg: 70, count: { 个: 3, 根: 2, 只: 3 } },
  'sichuan-peppercorn': { kcal: 260, proteinG: 8, carbsG: 50, fatG: 9, fiberG: 33, sugarG: 2, sodiumMg: 30, count: { 颗: 0.2, 粒: 0.2, 把: 5 } },
  'sichuan-pepper': { kcal: 300, proteinG: 9, carbsG: 55, fatG: 10, fiberG: 35, sugarG: 2, sodiumMg: 30, count: { 颗: 0.2, 粒: 0.2, 把: 5 } },
  'sichuan-pepper-powder': { kcal: 300, proteinG: 9, carbsG: 55, fatG: 10, fiberG: 35, sugarG: 2, sodiumMg: 30, density: 0.5, count: { 茶匙: 2.5, 小勺: 2.5, 小匙: 2.5 } },
  'star-anise': { kcal: 340, proteinG: 17, carbsG: 75, fatG: 5, fiberG: 40, sugarG: 3, sodiumMg: 25, count: { 个: 0.5, 颗: 0.5, 粒: 0.5 } },
  cinnamon: { kcal: 250, proteinG: 4, carbsG: 80, fatG: 1.4, fiberG: 53, sugarG: 2, sodiumMg: 10, count: { 块: 5, 根: 4, 小块: 3, 茶匙: 2.5, 小勺: 2.5, 小匙: 2.5 } },
  'bay-leaf': { kcal: 310, proteinG: 8, carbsG: 75, fatG: 8, fiberG: 25, sugarG: 2, sodiumMg: 25, count: { 片: 0.25, 张: 0.25, 小片: 0.15 } },
  cumin: { kcal: 375, proteinG: 18, carbsG: 44, fatG: 22, fiberG: 11, sugarG: 1, sodiumMg: 170, density: 0.5, count: { 茶匙: 2.5, 小勺: 2.5, 勺: 5 } },
  clove: { kcal: 320, proteinG: 6, carbsG: 66, fatG: 20, fiberG: 34, sugarG: 2, sodiumMg: 280, count: { 粒: 0.2, 颗: 0.2 } },
  tsaoko: { kcal: 330, proteinG: 8, carbsG: 70, fatG: 3, fiberG: 20, sodiumMg: 10, count: { 个: 8 } },
  galangal: { kcal: 70, proteinG: 2, carbsG: 16, fatG: 0.5, fiberG: 4, sodiumMg: 10, count: { 个: 15, 片: 3, 块: 15 } },
  turmeric: { kcal: 354, proteinG: 7.8, carbsG: 65, fatG: 10, fiberG: 21, sugarG: 3, sodiumMg: 38, density: 0.6, count: { 茶匙: 3 } },
  'five-spice-powder': { kcal: 300, proteinG: 10, carbsG: 58, fatG: 8, fiberG: 30, sodiumMg: 80, density: 0.55, count: { 茶匙: 2.75, 小勺: 2.75, 小匙: 2.75, 勺: 5.5 } },
  'five-spice': { kcal: 300, proteinG: 10, carbsG: 58, fatG: 8, fiberG: 30, sodiumMg: 80, density: 0.55, count: { 茶匙: 2.75, 小勺: 2.75, 小匙: 2.75, 勺: 5.5 } },
  'thirteen-spice': { kcal: 300, proteinG: 10, carbsG: 58, fatG: 8, fiberG: 30, sodiumMg: 80, density: 0.55 },
  'curry-powder': { kcal: 300, proteinG: 10, carbsG: 58, fatG: 10, fiberG: 25, sodiumMg: 120, density: 0.6, count: { 茶匙: 3, 小勺: 3, 袋: 20 } },
  curry: { kcal: 500, proteinG: 6, carbsG: 45, fatG: 33, sugarG: 8, saturatedFatG: 20, sodiumMg: 2700, count: { 块: 20, 盒: 100, 小块: 15 } },
  vanilla: { kcal: 250, proteinG: 0.5, carbsG: 12, fatG: 0.1, sugarG: 12, density: 0.85, count: { 滴: 0.05, 茶匙: 4, 小勺: 4, 小匙: 4 } },
  'vanilla-extract': { kcal: 250, proteinG: 0.5, carbsG: 12, fatG: 0.1, sugarG: 12, density: 0.85, count: { 滴: 0.05, 茶匙: 4, 小勺: 4 } },

  // —— 酒类 ——
  'cooking-wine': { kcal: 70, proteinG: 0.3, carbsG: 8, fatG: 0, sugarG: 2, sodiumMg: 400, density: 0.98 },
  'shaoxing-wine': { kcal: 100, proteinG: 1, carbsG: 7, fatG: 0, sugarG: 1, density: 1 },
  rum: { kcal: 231, proteinG: 0, carbsG: 0, fatG: 0, density: 0.95 },
  baijiu: { kcal: 298, proteinG: 0, carbsG: 0.2, fatG: 0, density: 0.95 },
  beer: { kcal: 43, proteinG: 0.5, carbsG: 3.6, fatG: 0, sugarG: 0.5, density: 1, count: { 听: 330, 瓶: 500, 罐: 330 } },
  'red-wine': { kcal: 85, proteinG: 0.1, carbsG: 2.6, fatG: 0, sugarG: 0.6, density: 0.99 },
  'white-wine': { kcal: 82, proteinG: 0.1, carbsG: 2.6, fatG: 0, sugarG: 0.8, density: 0.99 },

  // —— 其它 ——
  chocolate: { kcal: 550, proteinG: 5, carbsG: 50, fatG: 35, sugarG: 45, saturatedFatG: 20, sodiumMg: 20, count: { 块: 50, 大块: 100, 小块: 20 } },
  'dark-chocolate': { kcal: 600, proteinG: 8, carbsG: 40, fatG: 43, sugarG: 30, saturatedFatG: 25, sodiumMg: 10, count: { 块: 50, 大块: 100 } },
  'cocoa-powder': { kcal: 400, proteinG: 20, carbsG: 30, fatG: 12, fiberG: 28, sugarG: 3, sodiumMg: 20, density: 0.5, count: { 汤匙: 7.5, 大勺: 7.5, 茶匙: 2.5, 小勺: 2.5, 勺: 5 } },
  kimchi: { kcal: 24, proteinG: 1.5, carbsG: 4, fatG: 0.2, fiberG: 1.3, sugarG: 2.4, sodiumMg: 500, count: { 颗: 1000, 个: 800 } },
  'pickled-cabbage': { kcal: 18, proteinG: 1.5, carbsG: 3, fatG: 0.2, fiberG: 1.5, sugarG: 1, sodiumMg: 700, count: { 把: 200 } },
  'pickled-mustard': { kcal: 30, proteinG: 2.5, carbsG: 5, fatG: 0.3, fiberG: 2, sugarG: 1, sodiumMg: 3100, count: { 把: 100 } },
  'pickled-chili': { kcal: 33, proteinG: 1.5, carbsG: 7, fatG: 0.3, fiberG: 2, sodiumMg: 1000, count: { 个: 15, 颗: 15 } },
  caoguo: { kcal: 330, proteinG: 8, carbsG: 70, fatG: 3, fiberG: 20, sodiumMg: 10, count: { 个: 8 } },
  'chen-pi': { kcal: 290, proteinG: 8, carbsG: 75, fatG: 1, fiberG: 35, sugarG: 50, sodiumMg: 300, count: { 片: 2 } },
  sugarcane: { kcal: 60, proteinG: 0.4, carbsG: 16, fatG: 0.1, fiberG: 1.5, sugarG: 15, sodiumMg: 3, count: { 段: 150, 节: 200 } },
}

// 名称分派例外：同一 mergeKey 下按食材名区分更精确的形态。
// [正则, 该正则命中时使用的 profile 键]
export const nameProfileOverrides: Array<{ pattern: RegExp; profileKey: string }> = [
  { pattern: /米饭|熟饭|白饭|剩饭|蛋炒饭|炒饭/u, profileKey: 'cooked-rice' },
  { pattern: /手擀|切面|碱面|湿面|新鲜面条|鲜面条|拉面(?!干)|乌冬/u, profileKey: 'fresh-noodle' },
  { pattern: /嫩豆腐|内酯|南豆腐|软豆腐/u, profileKey: 'soft-tofu' },
  { pattern: /腐竹|油皮/u, profileKey: 'tofu-skin-dried' },
  { pattern: /千张|豆皮|豆腐皮|响铃/u, profileKey: 'tofu-skin' },
  { pattern: /茴香苗|茴香(?!籽|粉|粒)/u, profileKey: 'fennel-herb' },
  { pattern: /小茴香|茴香籽|茴香粉/u, profileKey: 'fennel-seed' },
  { pattern: /富牛|肥牛|牛腩/u, profileKey: 'beef' },
  { pattern: /里脊/u, profileKey: 'beef-tenderloin' },
  { pattern: /腊鸭腿|鸭腿/u, profileKey: 'duck-leg' },
  { pattern: /干贝|瑶柱/u, profileKey: 'scallop' },
  { pattern: /山楂干|酸梅干/u, profileKey: 'hawthorn-dried' },
  { pattern: /干海带|海带干|干紫菜/u, profileKey: 'kelp-dried' },
  { pattern: /咸蛋黄|咸鸭蛋黄/u, profileKey: 'salted-egg-yolk' },
  { pattern: /皮蛋/u, profileKey: 'century-egg' },
  { pattern: /虾仁/u, profileKey: 'shrimp' },
  { pattern: /鸡翅|中翅|翅根|翅尖|鸡翼/u, profileKey: 'chicken-wing' },
  { pattern: /鸡腿|鸡大腿|琵琶腿/u, profileKey: 'chicken-thigh' },
  { pattern: /鸡胸|鸡脯/u, profileKey: 'chicken-breast' },
  { pattern: /鸡爪|凤爪|鸡脚/u, profileKey: 'chicken-feet' },
  { pattern: /肥肠|猪肠|大肠|小肠|直肠/u, profileKey: 'pork-intestine' },
]

// 长尾食材的分类近似规则（按名称正则，命中即用近似值，confidence 记为 medium 以下）。
export const categoryFallbacks: Array<{ pattern: RegExp; profile: FoodProfile }> = [
  { pattern: /肉|五花|排骨|骨|内脏|肝|腰|肚|肠|蹄|爪/u, profile: { kcal: 230, proteinG: 18, carbsG: 1, fatG: 17, saturatedFatG: 6, sodiumMg: 90, approx: true } },
  { pattern: /鸡|鸭|鹅|鸽|鹌鹑/u, profile: { kcal: 190, proteinG: 19, carbsG: 0.5, fatG: 12, saturatedFatG: 3.4, sodiumMg: 80, approx: true } },
  { pattern: /鱼|虾|蟹|贝|蚝|蛤|蛏|螺|鱿|墨鱼|章鱼|海参|鲍|鱼翅|海鲜/u, profile: { kcal: 110, proteinG: 19, carbsG: 1, fatG: 3, saturatedFatG: 0.8, sodiumMg: 150, approx: true } },
  { pattern: /豆腐|豆干|腐竹|豆皮|千张|豆浆|豆制品|素鸡|豆花/u, profile: { kcal: 120, proteinG: 10, carbsG: 5, fatG: 7, saturatedFatG: 1.5, sodiumMg: 200, approx: true } },
  { pattern: /米|饭|粥|糯米|米粉|粿|糍粑|粽子|年糕|河粉|肠粉/u, profile: { kcal: 220, proteinG: 5, carbsG: 45, fatG: 1.5, fiberG: 1, sugarG: 2, sodiumMg: 40, approx: true } },
  { pattern: /面|粉|饼|馒头|花卷|饺子|馄饨|包子|面包|意面|披萨|通心粉/u, profile: { kcal: 280, proteinG: 9, carbsG: 52, fatG: 3, fiberG: 2, sugarG: 2, sodiumMg: 200, approx: true } },
  { pattern: /菜|瓜|笋|椒|茄|葱|姜|蒜|芹|莴|藕|萝卜|薯|芋|豆苗|芽|菇|蘑|耳|菌|芦|白菜|芥|菠菜|苋|茼蒿/u, profile: { kcal: 40, proteinG: 2, carbsG: 8, fatG: 0.4, fiberG: 2.5, sugarG: 3, sodiumMg: 25, approx: true } },
  { pattern: /果|蕉|橙|柚|桃|李|杏|莓|枣|柿|石榴|葡萄|西瓜|哈密瓜|甜瓜/u, profile: { kcal: 55, proteinG: 0.8, carbsG: 14, fatG: 0.3, fiberG: 2, sugarG: 11, sodiumMg: 5, approx: true } },
  { pattern: /奶|乳|酪|芝士|黄油|淡奶油|酸奶/u, profile: { kcal: 150, proteinG: 8, carbsG: 8, fatG: 10, saturatedFatG: 6, sugarG: 5, sodiumMg: 120, approx: true } },
  { pattern: /蛋/u, profile: { kcal: 140, proteinG: 12, carbsG: 2, fatG: 9, saturatedFatG: 3, sodiumMg: 130, approx: true } },
  { pattern: /油/u, profile: { kcal: 884, proteinG: 0, carbsG: 0, fatG: 100, saturatedFatG: 15, density: 0.92, approx: true } },
  { pattern: /酱|膏|汁|卤|露|豉/u, profile: { kcal: 120, proteinG: 4, carbsG: 22, fatG: 2, sugarG: 10, sodiumMg: 3500, density: 1.15, approx: true } },
  { pattern: /酒/u, profile: { kcal: 250, proteinG: 0.1, carbsG: 3, fatG: 0, density: 0.95, approx: true } },
  { pattern: /糖|蜜/u, profile: { kcal: 390, proteinG: 0.2, carbsG: 98, fatG: 0, sugarG: 95, density: 1.2, approx: true } },
  { pattern: /粉|精|香料|香草|藤椒|cumin|孜然|花椒|胡椒|八角|桂皮|香叶|丁香|豆蔻|草果/u, profile: { kcal: 300, proteinG: 10, carbsG: 60, fatG: 8, fiberG: 25, sugarG: 2, sodiumMg: 60, density: 0.55, approx: true } },
  { pattern: /汤|水|茶|饮/u, profile: { kcal: 10, proteinG: 0.3, carbsG: 2, fatG: 0.1, sodiumMg: 20, density: 1, approx: true } },
  { pattern: /坚果|瓜子|花生|核桃|杏仁|腰果|芝麻|松子|开心果|榛子/u, profile: { kcal: 580, proteinG: 18, carbsG: 20, fatG: 50, fiberG: 8, sugarG: 4, saturatedFatG: 8, sodiumMg: 10, approx: true } },
  { pattern: /干货|干菜|腌|腊|熏|风干/u, profile: { kcal: 250, proteinG: 15, carbsG: 35, fatG: 5, fiberG: 10, sugarG: 5, sodiumMg: 1200, approx: true } },
]

// 明显不是食材的行（归一化管道带入的碎语），不计入营养也不计入覆盖率分母。
export const junkEntryPatterns: RegExp[] = [
  /^(做法|用料|配菜|主料|辅料|调料|馅料|装饰|腌制|面团|馅心|器材|工具|准备|步骤)[:：一二三四五六七八九十]?/u,
  /^[#＃]/u,
  /(很多耐心|准备工作|自备|随意搭配|见图|按需|喜欢吃|有就放|没有可)/u,
  /^[一二三四五六七八九十]{1,2}[:：.。、]$/u,
]

// 用于给"常规食材"打底的单位换算（米面/干货等干燥食材的碗/杯体积密度之外，见各 profile.count）。
export const volumeUnitsGrams: Record<string, number> = {
  汤匙: 15, 汤勺: 15, 大勺: 15, 大匙: 15, 白瓷勺: 15, 炒菜勺: 15,
  茶匙: 5, 小勺: 5, 小匙: 5, 调料勺: 5,
  勺: 10, 匙: 5,
  杯: 240, 小碗: 200, 大碗: 300, 碗: 250,
  滴: 0.05,
}

export type { FoodProfile as IngredientNutritionProfile }