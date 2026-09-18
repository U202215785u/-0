import type { Recipe } from './types';

/**
 * 标签体系（单一事实源）
 *
 * 维度与上限（一个菜在每个维度内至多保留）：
 *   method   烹饪方式    ≤1（只保留主做法）
 *   dishType 菜品种类    ≤1
 *   feature  特点        ≤2（家常菜、快手菜可并存）
 *   diet     饮食偏好    ≤1
 * 总数不超过 MAX_TAGS_PER_RECIPE。
 * 旧数据中的别名统一映射到规范标签；数据仓库(app/catalog/recipes)
 * 必须满足本体系，质量门禁在构建时校验（见 quality.ts）。
 */

export type TagDimensionKey = 'method' | 'dishType' | 'feature' | 'diet';

export type TagDimension = {
  key: TagDimensionKey;
  label: string;
  tags: readonly string[];
};

export const TAG_DIMENSIONS: Record<TagDimensionKey, TagDimension> = {
  method: {
    key: 'method',
    label: '烹饪方式',
    tags: ['炒', '煮', '蒸', '炸', '煎', '烤', '炖', '烧焖', '凉拌'],
  },
  dishType: {
    key: 'dishType',
    label: '菜品种类',
    tags: ['主食', '汤羹', '点心'],
  },
  feature: {
    key: 'feature',
    label: '特点',
    tags: ['家常菜', '快手菜'],
  },
  diet: {
    key: 'diet',
    label: '饮食偏好',
    tags: ['素菜', '减脂高蛋白'],
  },
};

export const TAG_DIMENSION_ORDER: readonly TagDimensionKey[] = ['method', 'dishType', 'feature', 'diet'];

export const TAG_DIMENSION_LIST: readonly TagDimension[] = TAG_DIMENSION_ORDER.map((key) => TAG_DIMENSIONS[key]);

/** 每个维度的标签数量上限 */
export const MAX_TAGS_PER_DIMENSION: Record<TagDimensionKey, number> = {
  method: 1,
  dishType: 1,
  feature: 2,
  diet: 1,
};

export const MAX_TAGS_PER_RECIPE = 4;

/** 历史数据中出现的旧写法/别称 → 规范标签 */
export const TAG_ALIASES: Record<string, string> = {
  烧: '烧焖',
  炖菜: '炖',
  汤底: '汤羹',
  快手: '快手菜',
  凉菜: '凉拌',
  凉拌菜: '凉拌',
  炒菜: '炒',
  煎炸: '炸',
};

const DIMENSION_OF_TAG = new Map<string, TagDimensionKey>();
for (const dimension of TAG_DIMENSION_LIST) {
  for (const tag of dimension.tags) DIMENSION_OF_TAG.set(tag, dimension.key);
}

export const ALL_TAGS: ReadonlySet<string> = new Set(DIMENSION_OF_TAG.keys());

export function tagDimension(tag: string): TagDimensionKey | undefined {
  return DIMENSION_OF_TAG.get(tag);
}

/**
 * 第一层清洗：别名映射 → 去空白 → 剔除体系外标签 → 字符串级去重。
 * 不做维度收口，保留多做法候选，供证据裁剪与后续模型判断。
 */
export function sanitizeTags(tags: readonly string[] | undefined): string[] {
  if (!tags) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of tags) {
    const tag = raw.trim();
    const canonical = TAG_ALIASES[tag] ?? tag;
    if (!canonical || !ALL_TAGS.has(canonical)) continue;
    if (seen.has(canonical)) continue;
    seen.add(canonical);
    result.push(canonical);
  }
  return result;
}

/**
 * 最终归一化：sanitize 后按维度上限收口（同维度保留前者），并施加总数上限。
 */
export function normalizeRecipeTags(tags: readonly string[] | undefined): string[] {
  const result: string[] = [];
  const perDimension = new Map<TagDimensionKey, number>();
  for (const tag of sanitizeTags(tags)) {
    const dimension = DIMENSION_OF_TAG.get(tag)!;
    const count = perDimension.get(dimension) ?? 0;
    if (count >= MAX_TAGS_PER_DIMENSION[dimension]) continue;
    if (result.length >= MAX_TAGS_PER_RECIPE) break;
    perDimension.set(dimension, count + 1);
    result.push(tag);
  }
  return result;
}

export type TagIssueCode = 'unknown-tag' | 'duplicate-tag' | 'tag-dimension-overflow' | 'too-many-tags';

export type TagIssue = {
  code: TagIssueCode;
  tag?: string;
  detail?: string;
};

export function getRecipeTagIssues(recipe: Recipe): TagIssue[] {
  const issues: TagIssue[] = [];
  const tags = recipe.tags ?? [];
  const seen = new Set<string>();
  const perDimension = new Map<TagDimensionKey, number>();
  for (const raw of tags) {
    const tag = raw.trim();
    if (!tag || !ALL_TAGS.has(tag)) {
      issues.push({ code: 'unknown-tag', tag: raw, detail: `"${raw}" 不属于标签体系` });
      continue;
    }
    if (seen.has(tag)) {
      issues.push({ code: 'duplicate-tag', tag, detail: `重复标签 "${tag}"` });
      continue;
    }
    seen.add(tag);
    const dimension = DIMENSION_OF_TAG.get(tag)!;
    const count = (perDimension.get(dimension) ?? 0) + 1;
    perDimension.set(dimension, count);
    if (count > MAX_TAGS_PER_DIMENSION[dimension]) {
      issues.push({
        code: 'tag-dimension-overflow',
        tag,
        detail: `「${TAG_DIMENSIONS[dimension].label}」维度标签超过 ${MAX_TAGS_PER_DIMENSION[dimension]} 个`,
      });
    }
  }
  if (sanitizeTags(tags).length > MAX_TAGS_PER_RECIPE) {
    issues.push({ code: 'too-many-tags', detail: `标签超过 ${MAX_TAGS_PER_RECIPE} 个上限` });
  }
  return issues;
}

/** 从标题按高置信度规则推断菜品种类；无把握返回 undefined（优先点心，其次主食，再到汤羹） */
export function inferDishTypeTag(title: string): string | undefined {
  if (/月饼|饼干|蛋挞|汤圆|元宵|布丁|点心|甜点|麻花|曲奇|司康|华夫|松饼|冰淇淋|冰激凌|糖葫芦|蛋糕|糕/.test(title)) return '点心';
  if (/饭|面|粥|馒头|花卷|饺子|包子|馄饨|云吞|粽子|饼|烧麦|油条|窝头|糍粑|饭团|米线|河粉|意面|面包|吐司|贝果/.test(title)) return '主食';
  if (/汤|羹/.test(title)) return '汤羹';
  return undefined;
}

/** 做法关键词证据（清洗时仅用于删除“步骤完全无依据”的做法标签） */
export const METHOD_EVIDENCE: Record<string, RegExp> = {
  炒: /炒|翻炒|煸|爆香|滑炒|热油快/,
  煮: /煮|焯|汆|滚|沸腾|烧开|熬|煲|炖煮|沸水|开水/,
  蒸: /蒸/,
  炸: /炸|油温|油锅|热油|七成热/,
  煎: /煎/,
  烤: /烤|烤箱|预热/,
  炖: /炖/,
  烧焖: /焖|红烧|收汁|烧制|烧至|炖煮|烧入味|烧出|小火.*烧/,
  凉拌: /凉拌|拌匀|拌入|调味汁|麻酱|芥末|腌渍/,
};

/**
 * 确定性清洗（供数据整改脚本使用，做 LLM 细化前的粗加工）：
 * sanitize → 标题推断菜品种类（缺失时补上）→ 做法证据裁剪（仅删除步骤零依据的做法）。
 * 返回结果可能在方法维度仍有多个标签，最终由 normalizeRecipeTags 收口。
 */
export function cleanRecipeTags(recipe: Recipe, opts?: { pruneMethods?: boolean }): string[] {
  const prune = opts?.pruneMethods ?? true;
  const inferred = inferDishTypeTag(recipe.title);
  const stepsText = recipe.steps.map((step) => step.text).join('\n');
  const result: string[] = [];
  for (const tag of sanitizeTags(recipe.tags)) {
    const dimension = DIMENSION_OF_TAG.get(tag)!;
    if (dimension === 'method') {
      if (!prune) {
        result.push(tag);
        continue;
      }
      const evidence = METHOD_EVIDENCE[tag];
      if (evidence && !evidence.test(stepsText)) continue;
    }
    if (dimension === 'dishType' && inferred) {
      if (tag !== inferred) continue;
    }
    result.push(tag);
  }
  if (inferred && !result.includes(inferred)) result.push(inferred);
  return sanitizeTags(result);
}

/** 方法标签平局优先级（证据计数相同时取前者） */
const METHOD_PRIORITY: readonly string[] = ['凉拌', '烤', '炸', '煎', '蒸', '炖', '烧焖', '炒', '煮'];

/**
 * 最终落地：清洗 → 主做法裁决（方法维度若有多个，按步骤里关键词命中次数最多者保留）→ 维度收口。
 * pruneMethods=false 时跳过做法证据裁剪与主做法裁决，仅做别名/去重/标题推断/收口
 * （用于 LLM 精修结果的后置保险，避免规则与模型判断打架）。
 * 幂等，且输出必然满足标签体系。
 */
export function resolveRecipeTags(recipe: Recipe, opts?: { pruneMethods?: boolean }): string[] {
  const prune = opts?.pruneMethods ?? true;
  const cleaned = cleanRecipeTags(recipe, { pruneMethods: prune });
  if (!prune) return normalizeRecipeTags(cleaned);
  const stepsText = recipe.steps.map((step) => step.text).join('\n');
  const methods = cleaned.filter((tag) => DIMENSION_OF_TAG.get(tag) === 'method');
  let resolved = cleaned;
  if (methods.length > 1) {
    const score = (tag: string) => {
      const evidence = METHOD_EVIDENCE[tag];
      if (!evidence) return 0;
      const matches = stepsText.match(new RegExp(evidence.source, 'g'));
      return matches?.length ?? 0;
    };
    const scored = methods
      .map((tag) => ({ tag, hits: score(tag), priority: -METHOD_PRIORITY.indexOf(tag) }))
      .sort((a, b) => b.hits - a.hits || b.priority - a.priority);
    const winner = scored[0].tag;
    resolved = [...cleaned.filter((tag) => !methods.includes(tag)), winner];
  }
  return normalizeRecipeTags(resolved);
}