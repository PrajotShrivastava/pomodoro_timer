import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { pomodorosByTask } from '@/lib/stats';
import { useActions, useAppState } from '@/state/AppProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { insetShadow, radius, space } from '@/theme/theme';

import { AppText } from './AppText';
import { IconButton } from './Buttons';
import { Sheet } from './Sheet';
import { TextField } from './TextField';

interface Props {
  visible: boolean;
  onClose: () => void;
  selectedId: string | null;
  onSelect: (taskId: string | null) => void;
}

/** Choose (or quickly create) the task the timer's focus sessions count toward. */
export function TaskPicker({ visible, onClose, selectedId, onSelect }: Props) {
  const t = useTheme();
  const { tasks, sessions } = useAppState();
  const actions = useActions();
  const [draft, setDraft] = useState('');
  const counts = useMemo(() => pomodorosByTask(sessions), [sessions]);
  const open = tasks.filter((x) => !x.done);

  const addAndSelect = () => {
    if (!draft.trim()) return;
    const id = actions.addTask(draft, 1);
    setDraft('');
    onSelect(id);
  };

  const renderRow = (id: string | null, title: string, meta?: string) => {
    const selected = id === selectedId;
    return (
      <Pressable
        key={id ?? 'none'}
        onPress={() => {
          actions.tap();
          onSelect(id);
        }}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={title}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md,
          paddingVertical: space.md,
          paddingHorizontal: space.lg,
          borderRadius: radius.md,
          backgroundColor: t.bg,
          boxShadow: selected ? insetShadow(t, 'sm') : undefined,
        }}
      >
        <Ionicons
          name={selected ? 'radio-button-on' : 'radio-button-off'}
          size={20}
          color={selected ? t.phase.focus : t.textFaint}
        />
        <AppText variant="body" numberOfLines={1} style={{ flex: 1 }}>
          {title}
        </AppText>
        {meta && (
          <AppText variant="caption" tone="muted">
            {meta}
          </AppText>
        )}
      </Pressable>
    );
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Focus on a task">
      <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center', marginBottom: space.lg }}>
        <TextField
          value={draft}
          onChangeText={setDraft}
          placeholder="New task…"
          returnKeyType="done"
          onSubmitEditing={addAndSelect}
          containerStyle={{ flex: 1 }}
          accessibilityLabel="New task title"
          maxLength={120}
        />
        <IconButton
          icon="add"
          size={48}
          depth="md"
          color={t.phase.focus}
          onPress={addAndSelect}
          disabled={!draft.trim()}
          accessibilityLabel="Add task and focus on it"
        />
      </View>
      <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ gap: space.xs }} keyboardShouldPersistTaps="handled">
        {renderRow(null, 'No task')}
        {open.map((task) => renderRow(task.id, task.title, `${counts[task.id] ?? 0}/${task.estimatedPomodoros}`))}
        {open.length === 0 && (
          <AppText variant="caption" tone="muted" align="center" style={{ marginTop: space.lg }}>
            No open tasks yet — add one above.
          </AppText>
        )}
      </ScrollView>
    </Sheet>
  );
}
