import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Settings } from '../lib/settings';
import { boardPalette } from '../lib/theme';
import type { useSudokuGame } from '../lib/useSudokuGame';
import { AnimalPicker } from './AnimalPicker';
import { Board } from './Board';
import { ControlButton } from './ControlButton';

interface Props {
  state: ReturnType<typeof useSudokuGame>;
  settings: Settings;
  width: number;
  /** Race battles turn hints off to keep it fair. */
  allowHints?: boolean;
  /** Night mode: only squares next to the selected one are visible. */
  night?: boolean;
  terrainIcons?: Record<string, string>;
}

const LANTERN_RADIUS = 1;

/** Board + controls + animal picker for single-player style games. */
export function PlayArea({ state, settings, width, allowHints = true, night, terrainIcons }: Props) {
  const palette = boardPalette(settings.colorblindMode);
  const n = state.game.layout.size;
  const { selected, status } = state;

  // Night: light the squares around the selected one. Everything shows once the game ends.
  const visible = useMemo(() => {
    if (!night || status !== 'playing') return undefined;
    const lit = new Set<number>();
    if (selected === null) return lit;
    const r0 = Math.floor(selected / n);
    const c0 = selected % n;
    for (let r = r0 - LANTERN_RADIUS; r <= r0 + LANTERN_RADIUS; r++) {
      for (let c = c0 - LANTERN_RADIUS; c <= c0 + LANTERN_RADIUS; c++) {
        if (r >= 0 && r < n && c >= 0 && c < n) lit.add(r * n + c);
      }
    }
    return lit;
  }, [night, status, selected, n]);

  return (
    <>
      <Board
        puzzle={state.game}
        grid={state.grid}
        given={state.given}
        notes={state.notes}
        selected={state.selected}
        wrong={state.wrong}
        highlightMatching={settings.highlightMatching && !night}
        showBadges={settings.showNumberBadges}
        palette={palette}
        celebration={state.celebration}
        terrainIcons={terrainIcons}
        visible={visible}
        runaway={state.runaway}
        width={width}
        onSelect={state.setSelected}
      />

      <View style={[styles.controls, { width }]}>
        <ControlButton label="Undo" icon="↶" onPress={state.undo} disabled={!state.canUndo} />
        <ControlButton label="Erase" icon="⌫" onPress={state.erase} />
        <ControlButton
          label={state.notesMode ? 'Notes ON' : 'Notes'}
          icon="✎"
          onPress={state.toggleNotesMode}
          active={state.notesMode}
        />
        <ControlButton label="Auto" icon="✎✎" onPress={state.autoNotes} />
        {allowHints ? <ControlButton label="Hint" icon="💡" onPress={state.hint} /> : null}
      </View>

      <AnimalPicker
        size={state.game.layout.size}
        counts={state.counts}
        width={width}
        tinted={palette.animalTints}
        showBadges={settings.showNumberBadges}
        onPick={state.place}
      />
    </>
  );
}

const styles = StyleSheet.create({
  controls: {
    flexDirection: 'row',
    gap: 6,
  },
});
