import { useState } from 'react';
import { View } from 'react-native';

import { confirm } from '@/lib/confirm';
import type { Task } from '@/lib/types';
import { useActions } from '@/state/AppProvider';
import { space } from '@/theme/theme';

import { NeuButton } from './Buttons';
import { Sheet } from './Sheet';
import { Stepper } from './Stepper';
import { TextField } from './TextField';

interface Props {
  task: Task | null;
  onClose: () => void;
}

export function TaskEditor({ task, onClose }: Props) {
  return (
    <Sheet visible={!!task} onClose={onClose} title="Edit task">
      {/* Keyed so the form state re-initializes for each task opened. */}
      {task && <TaskForm key={task.id} task={task} onClose={onClose} />}
    </Sheet>
  );
}

function TaskForm({ task, onClose }: { task: Task; onClose: () => void }) {
  const actions = useActions();
  const [title, setTitle] = useState(task.title);
  const [estimate, setEstimate] = useState(task.estimatedPomodoros);

  const save = () => {
    if (!title.trim()) return;
    actions.updateTask(task.id, { title, estimatedPomodoros: estimate });
    onClose();
  };

  const remove = () => {
    confirm('Delete task?', `“${task.title}” will be removed. Its focus history is kept.`, 'Delete', () => {
      actions.deleteTask(task.id);
      onClose();
    });
  };

  return (
    <>
      <TextField
        value={title}
        onChangeText={setTitle}
        placeholder="Task title"
        accessibilityLabel="Task title"
        returnKeyType="done"
        onSubmitEditing={save}
        maxLength={120}
      />
      <View style={{ marginTop: space.xl }}>
        <Stepper
          label="Estimated pomodoros"
          hint="How many focus sessions it should take"
          value={estimate}
          onChange={setEstimate}
          min={1}
          max={20}
        />
      </View>
      <View style={{ flexDirection: 'row', gap: space.md, marginTop: space.xxl }}>
        <NeuButton label="Delete" icon="trash-outline" tone="danger" onPress={remove} style={{ flex: 1 }} />
        <NeuButton label="Save" icon="checkmark" onPress={save} disabled={!title.trim()} style={{ flex: 1 }} />
      </View>
    </>
  );
}
