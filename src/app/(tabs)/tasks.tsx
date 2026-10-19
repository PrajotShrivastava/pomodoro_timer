import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { IconButton, NeuButton } from '@/components/Buttons';
import { Checkbox } from '@/components/Checkbox';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { Surface } from '@/components/Surface';
import { TaskEditor } from '@/components/TaskEditor';
import { TextField } from '@/components/TextField';
import { confirm } from '@/lib/confirm';
import { pomodorosByTask } from '@/lib/stats';
import type { Task } from '@/lib/types';
import { useActions, useAppState } from '@/state/AppProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/theme';

type Filter = 'open' | 'done';

export default function TasksScreen() {
  const t = useTheme();
  const { tasks, sessions, timer } = useAppState();
  const actions = useActions();
  const [draft, setDraft] = useState('');
  const [filter, setFilter] = useState<Filter>('open');
  const [editing, setEditing] = useState<Task | null>(null);

  const counts = useMemo(() => pomodorosByTask(sessions), [sessions]);
  const open = tasks.filter((x) => !x.done);
  const done = tasks
    .filter((x) => x.done)
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
  const visible = filter === 'open' ? open : done;

  const add = () => {
    if (!draft.trim()) return;
    actions.tap();
    actions.addTask(draft, 1);
    setDraft('');
    setFilter('open');
  };

  const focusOn = (task: Task) => {
    actions.tap();
    actions.setTimerTask(task.id);
    if (timer.status === 'idle' && timer.phase !== 'focus') actions.switchPhase('focus');
    router.navigate('/');
  };

  return (
    <Screen title="Tasks" subtitle={`${open.length} open · ${done.length} done`}>
      <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
        <TextField
          value={draft}
          onChangeText={setDraft}
          placeholder="What are you working on?"
          returnKeyType="done"
          onSubmitEditing={add}
          submitBehavior="submit"
          containerStyle={{ flex: 1 }}
          accessibilityLabel="New task title"
          maxLength={120}
        />
        <IconButton
          icon="add"
          size={52}
          depth="md"
          color={t.phase.focus}
          onPress={add}
          disabled={!draft.trim()}
          accessibilityLabel="Add task"
        />
      </View>

      <Segmented
        accessibilityLabel="Task filter"
        value={filter}
        onChange={(f) => {
          actions.tap();
          setFilter(f);
        }}
        options={[
          { value: 'open', label: `Open (${open.length})` },
          { value: 'done', label: `Done (${done.length})` },
        ]}
        style={{ marginTop: space.xl, marginBottom: space.xl }}
      />

      <View style={{ gap: space.lg }}>
        {visible.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            pomodoros={counts[task.id] ?? 0}
            active={timer.taskId === task.id}
            onToggle={() => {
              actions.tap();
              actions.toggleTask(task.id);
            }}
            onEdit={() => setEditing(task)}
            onFocus={() => focusOn(task)}
          />
        ))}
      </View>

      {visible.length === 0 && (
        <Surface variant="inset" style={{ padding: space.xxl, alignItems: 'center', gap: space.sm }}>
          <Ionicons
            name={filter === 'open' ? 'sunny-outline' : 'checkmark-done-outline'}
            size={28}
            color={t.textFaint}
          />
          <AppText variant="label" tone="muted" align="center">
            {filter === 'open' ? 'Nothing on your plate' : 'No completed tasks yet'}
          </AppText>
          <AppText variant="caption" tone="faint" align="center">
            {filter === 'open'
              ? 'Add a task above, then start a focus session for it.'
              : 'Tick off a task and it will show up here.'}
          </AppText>
        </Surface>
      )}

      {filter === 'done' && done.length > 0 && (
        <NeuButton
          label="Clear completed"
          icon="trash-outline"
          tone="danger"
          compact
          style={{ alignSelf: 'center', marginTop: space.xl }}
          onPress={() =>
            confirm(
              'Clear completed tasks?',
              `${done.length} completed task${done.length === 1 ? '' : 's'} will be removed. Focus history is kept.`,
              'Clear',
              actions.clearCompletedTasks,
            )
          }
        />
      )}

      <TaskEditor task={editing} onClose={() => setEditing(null)} />
    </Screen>
  );
}

interface RowProps {
  task: Task;
  pomodoros: number;
  active: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onFocus: () => void;
}

function TaskRow({ task, pomodoros, active, onToggle, onEdit, onFocus }: RowProps) {
  const t = useTheme();
  const reached = pomodoros >= task.estimatedPomodoros;
  return (
    <Surface
      depth="sm"
      radius={radius.md}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, paddingLeft: space.lg }}
    >
      <Checkbox
        checked={task.done}
        onToggle={onToggle}
        accessibilityLabel={`Mark “${task.title}” as ${task.done ? 'not done' : 'done'}`}
      />
      <Pressable
        onPress={onEdit}
        style={{ flex: 1, paddingVertical: space.xs }}
        accessibilityRole="button"
        accessibilityLabel={`${task.title}, ${pomodoros} of ${task.estimatedPomodoros} pomodoros. Edit`}
      >
        <AppText
          variant="body"
          numberOfLines={2}
          tone={task.done ? 'faint' : 'default'}
          style={task.done ? { textDecorationLine: 'line-through' } : undefined}
        >
          {task.title}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: 4 }}>
          <Ionicons
            name={reached ? 'checkmark-circle' : 'timer-outline'}
            size={13}
            color={reached ? t.phase.shortBreak : t.textMuted}
          />
          <AppText variant="caption" tone="muted">
            {pomodoros}/{task.estimatedPomodoros} pomodoros
          </AppText>
          {active && (
            <>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.phase.focus, marginLeft: space.sm }} />
              <AppText variant="caption" style={{ fontWeight: '700' }}>
                Focusing
              </AppText>
            </>
          )}
        </View>
      </Pressable>
      {!task.done && (
        <IconButton
          icon="play"
          size={40}
          color={t.phase.focus}
          active={active}
          onPress={onFocus}
          accessibilityLabel={`Focus on ${task.title}`}
        />
      )}
    </Surface>
  );
}
