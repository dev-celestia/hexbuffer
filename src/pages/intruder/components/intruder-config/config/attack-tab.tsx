import { NumberInputField } from './number-input-field';
import { useAttackTab } from '../../hooks/use-attack-tab';

export function AttackTab() {
  const { config, delayMs, handleDelayChange } = useAttackTab();

  if (!config) return null;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <NumberInputField
          label="Delay (ms)"
          value={delayMs}
          onChange={handleDelayChange}
        />
      </div>
    </div>
  );
}

export const InvokerAttackTab = AttackTab;
