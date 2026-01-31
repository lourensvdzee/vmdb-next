/** Category statistics with localization */
export interface CategoryStats {
  category: string;
  displayName: string;
  count: number;
  subcategories: string[];
}

/** Category grouping rules with localized names */
interface CategoryRule {
  keywords: string[];
  nl: string;
  de: string;
  en: string;
}

export const GROUPING_RULES: Record<string, CategoryRule> = {
  'BURGER': { keywords: ['burger'], nl: 'Burgers', de: 'Burger', en: 'Burgers' },
  'SAUSAGES': { keywords: ['wurst', 'bratwurst', 'leberwurst', 'sausage', 'worst', 'hotdog'], nl: 'Worst', de: 'Wurst', en: 'Sausages' },
  'NUGGETS': { keywords: ['nugget', 'bites'], nl: 'Nuggets', de: 'Nuggets', en: 'Nuggets' },
  'CHICKEN': { keywords: ['kip', 'kipfilet', 'kipschnitzel', 'chicken', 'döner', 'doner', 'gyros', 'kebab'], nl: 'Kip', de: 'Hähnchen', en: 'Chicken' },
  'MINCE': { keywords: ['mince', 'gehakt', 'hackfleisch', 'hackfaschiert', 'faschiert'], nl: 'Gehakt', de: 'Hackfleisch', en: 'Mince' },
  'SCHNITZEL': { keywords: ['schnitzel', 'cordon bleu'], nl: 'Schnitzel', de: 'Schnitzel', en: 'Schnitzel' },
  'STRIPS': { keywords: ['strips', 'reepjes', 'stroken'], nl: 'Reepjes', de: 'Streifen', en: 'Strips' },
  'MEATBALLS': { keywords: ['hackbällchen', 'gemüsebällchen', 'falafel', 'frikadelle', 'meatball', 'gehaktbal', 'bal'], nl: 'Gehaktballen', de: 'Hackbällchen', en: 'Meatballs' },
  'DELI': { keywords: ['brotbelag', 'cold cut', 'opsnij', 'vleeswaren', 'lachsschinken', 'lachschinken'], nl: 'Vleeswaren', de: 'Aufschnitt', en: 'Deli' },
  'BACON': { keywords: ['bacon', 'spek', 'spekjes', 'speck'], nl: 'Spek', de: 'Speck', en: 'Bacon' },
  'BEEF': { keywords: ['rind', 'rindfleisch', 'beef', 'steak', 'biefstuk'], nl: 'Rund', de: 'Rind', en: 'Beef' },
  'FILET': { keywords: ['filet', 'fillet'], nl: 'Filet', de: 'Filet', en: 'Filet' },
  'FISH': { keywords: ['fisch', 'fischstäbchen', 'fish', 'vis', 'zalm', 'lachs', 'tuna', 'tonijn'], nl: 'Vis', de: 'Fisch', en: 'Fish' },
  'TOFU': { keywords: ['tofu', 'tempeh'], nl: 'Tofu', de: 'Tofu', en: 'Tofu' },
};

/**
 * Get localized category name based on country
 */
export function getLocalizedName(groupKey: string, country?: string): string {
  const rule = GROUPING_RULES[groupKey];
  if (!rule) return groupKey.charAt(0) + groupKey.slice(1).toLowerCase();

  if (country === 'Netherlands') return rule.nl;
  if (country === 'Germany') return rule.de;
  return rule.en;
}

/**
 * Group similar categories under a main category with localized display names
 */
export function groupCategories(
  categoryCounts: Map<string, number>,
  country?: string
): CategoryStats[] {
  const grouped = new Map<string, { subcategories: Set<string>; count: number }>();

  // Initialize groups
  Object.keys(GROUPING_RULES).forEach(group => {
    grouped.set(group, { subcategories: new Set(), count: 0 });
  });

  // Group categories
  categoryCounts.forEach((count, category) => {
    const lowerCategory = category.toLowerCase().trim();

    // Check against each grouping rule (allow multi-category matching)
    for (const [groupName, rule] of Object.entries(GROUPING_RULES)) {
      if (rule.keywords.some(keyword => lowerCategory.includes(keyword))) {
        const group = grouped.get(groupName)!;
        group.subcategories.add(category);
        group.count += count;
        // Don't return - continue checking for multi-category matches
        // e.g., "Kipfilet" matches both CHICKEN (kip) and FILET (filet)
      }
    }
  });

  // Convert to array and filter out empty groups
  const stats: CategoryStats[] = [];

  grouped.forEach((data, groupName) => {
    if (data.count > 0) {
      stats.push({
        category: groupName,
        displayName: getLocalizedName(groupName, country),
        count: data.count,
        subcategories: Array.from(data.subcategories),
      });
    }
  });

  // Sort by product count (more products first)
  return stats.sort((a, b) => b.count - a.count);
}
