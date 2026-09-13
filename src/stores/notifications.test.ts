// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { useNotificationStore } from './notifications';

function reset() {
  useNotificationStore.setState({ alerts: [] });
}

beforeEach(reset);

describe('useNotificationStore', () => {
  it('adds alerts, defaulting optional fields', () => {
    useNotificationStore.getState().addAlert({ title: 'Hello', message: 'World' });

    const [alert] = useNotificationStore.getState().alerts;
    expect(alert.title).toBe('Hello');
    expect(alert.message).toBe('World');
    expect(alert.type).toBe('info');
    expect(alert.read).toBe(false);
    expect(alert.id).toBeTruthy();
  });

  it('replaces an existing alert with the same id instead of duplicating', () => {
    const { addAlert } = useNotificationStore.getState();
    addAlert({ id: 'same', title: 'One', message: 'm' });
    addAlert({ id: 'same', title: 'Two', message: 'm' });

    const alerts = useNotificationStore.getState().alerts;
    expect(alerts).toHaveLength(1);
    expect(alerts[0].title).toBe('Two');
  });

  it('prepends new alerts and caps the list at 100', () => {
    const { addAlert } = useNotificationStore.getState();
    for (let i = 0; i < 105; i++) {
      addAlert({ id: `alert-${i}`, title: `T${i}`, message: 'm' });
    }

    const alerts = useNotificationStore.getState().alerts;
    expect(alerts).toHaveLength(100);
    expect(alerts[0].id).toBe('alert-104');
    expect(alerts[99].id).toBe('alert-5');
  });

  it('marks a single alert and all alerts as read', () => {
    const { addAlert, markAsRead, markAllAsRead } = useNotificationStore.getState();
    addAlert({ id: 'a', title: 'A', message: 'm' });
    addAlert({ id: 'b', title: 'B', message: 'm' });

    markAsRead('a');
    expect(useNotificationStore.getState().alerts.find((a) => a.id === 'a')?.read).toBe(true);
    expect(useNotificationStore.getState().alerts.find((a) => a.id === 'b')?.read).toBe(false);

    markAllAsRead();
    expect(useNotificationStore.getState().alerts.every((a) => a.read)).toBe(true);
  });

  it('removes one alert or clears everything', () => {
    const { addAlert, removeAlert, clearAll } = useNotificationStore.getState();
    addAlert({ id: 'a', title: 'A', message: 'm' });
    addAlert({ id: 'b', title: 'B', message: 'm' });

    removeAlert('a');
    expect(useNotificationStore.getState().alerts.map((a) => a.id)).toEqual(['b']);

    clearAll();
    expect(useNotificationStore.getState().alerts).toEqual([]);
  });
});
