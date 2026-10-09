import { router, useLocalSearchParams } from 'expo-router';

import { DialogButton } from '../../components/Dialog';
import { SoloGame } from '../../components/SoloGame';
import { STARTER_ANIMALS } from '../../lib/animals';
import { useSettings } from '../../lib/settings';
import { DIFFICULTY_LABEL, generatePuzzle, parseSize, type BoardSize } from '../../lib/sudoku';

const TITLES: Record<BoardSize, string> = { 4: '4×4 Mini', 6: '6×6 Sudoku', 9: '9×9 Classic' };

/** Quick play: random puzzle at the difficulty chosen in Settings. */
export default function QuickPlayScreen() {
  const { size: rawSize } = useLocalSearchParams<{ size: string }>();
  const size = parseSize(rawSize);
  const { settings } = useSettings();

  return (
    <SoloGame
      title={TITLES[size]}
      saveSlot={{ kind: 'quick', size }}
      saveTitle={`Quick play ${TITLES[size]}`}
      animals={STARTER_ANIMALS}
      allowNewGame
      makeGame={() => ({
        puzzle: generatePuzzle(size, settings.difficulty),
        source: { mode: 'quick', size, difficulty: settings.difficulty },
        label: `Quick play · ${DIFFICULTY_LABEL[settings.difficulty]}`,
      })}
      winActions={({ newGame }) => (
        <>
          <DialogButton label="Play again" primary onPress={newGame} />
          <DialogButton label="Home" onPress={() => router.back()} />
        </>
      )}
    />
  );
}
