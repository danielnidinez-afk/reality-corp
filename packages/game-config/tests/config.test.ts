import { describe, expect, it } from 'vitest';
import { APEX_SYNDICATE_CONFIG, WORLD_CATALOG, getWorldConfig } from '@reality-corp/game-config';

describe('game-config integrity & DAG verification', () => {
  it('validates Apex Syndicate MVP and keeps Post-MVP worlds cleanly locked', () => {
    expect(getWorldConfig('apex-syndicate').isPlayableInMvp).toBe(true);
    expect(WORLD_CATALOG['chrono-forge'].isPlayableInMvp).toBe(false);
    expect(WORLD_CATALOG['sovereign-island'].isPlayableInMvp).toBe(false);
    expect(APEX_SYNDICATE_CONFIG.buildings.length).toBeGreaterThanOrEqual(5);
  });

  it('enforces unique IDs and valid growth rates [1.07, 1.15]', () => {
    const ids = new Set(APEX_SYNDICATE_CONFIG.buildings.map((b) => b.id));
    expect(ids.size).toBe(APEX_SYNDICATE_CONFIG.buildings.length);

    for (const building of APEX_SYNDICATE_CONFIG.buildings) {
      expect(building.growthRate).toBeGreaterThanOrEqual(1.07);
      expect(building.growthRate).toBeLessThanOrEqual(1.15);
    }

    // Starter garage server requires 0 energy so player can never softlock
    expect(APEX_SYNDICATE_CONFIG.buildings[0]?.energyKwDelta).toBeGreaterThanOrEqual(0);
  });

  it('ensures research tree forms an acyclic DAG referencing only defined nodes', () => {
    const byId = new Map(APEX_SYNDICATE_CONFIG.research.map((node) => [node.id, node]));
    const visiting = new Set<string>();
    const visited = new Set<string>();

    function visit(id: string): void {
      expect(visiting.has(id)).toBe(false);
      if (visited.has(id)) return;
      visiting.add(id);
      const node = byId.get(id);
      expect(node).toBeDefined();
      for (const prereq of node?.prerequisites ?? []) {
        expect(byId.has(prereq)).toBe(true);
        visit(prereq);
      }
      visiting.delete(id);
      visited.add(id);
    }

    for (const node of APEX_SYNDICATE_CONFIG.research) {
      visit(node.id);
    }
    expect(visited.size).toBe(APEX_SYNDICATE_CONFIG.research.length);
  });
});

