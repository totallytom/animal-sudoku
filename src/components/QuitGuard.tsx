import { useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useState } from 'react';

import { Dialog, DialogButton, DialogText, DialogTitle } from './Dialog';

type PendingAction = Parameters<Parameters<typeof usePreventRemove>[1]>[0]['data']['action'];

/** Asks before leaving a battle in progress (back button, swipe, or header back). */
export function QuitGuard({ active }: { active: boolean }) {
  const navigation = useNavigation();
  const [pending, setPending] = useState<PendingAction | null>(null);

  usePreventRemove(active, ({ data }) => setPending(data.action));

  return (
    <Dialog visible={pending !== null}>
      <DialogTitle>Quit battle?</DialogTitle>
      <DialogText>Scores for this battle will be lost.</DialogText>
      <DialogButton label="Keep playing" primary onPress={() => setPending(null)} />
      <DialogButton
        label="Quit"
        onPress={() => {
          const action = pending;
          setPending(null);
          if (action) navigation.dispatch(action);
        }}
      />
    </Dialog>
  );
}
