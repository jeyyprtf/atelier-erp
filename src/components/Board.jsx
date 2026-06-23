import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors, useDraggable, useDroppable } from '@dnd-kit/core'
import { STATUSES } from '../lib/supabase'
import TaskCard from './TaskCard'

const grid = 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'
const colCls = (active) =>
  `flex flex-col rounded-2xl border p-3 transition-colors ${active ? 'border-clay bg-clay-soft/30' : 'border-hairline bg-canvas/30'}`

function Header({ label, count }) {
  return (
    <div className="mb-3 flex items-center justify-between px-1">
      <span className="text-sm font-medium">{label}</span>
      <span className="rounded-full bg-bone px-2 py-0.5 text-xs text-muted">{count}</span>
    </div>
  )
}

function StaticColumn({ label, tasks, onOpen }) {
  return (
    <div className={colCls(false)}>
      <Header label={label} count={tasks.length} />
      <div className="flex min-h-[60px] flex-col gap-2.5">
        {tasks.map((t) => <div key={t.id} onClick={() => onOpen?.(t)}><TaskCard task={t} /></div>)}
      </div>
    </div>
  )
}

function DraggableCard({ task, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} onClick={() => onOpen?.(task)}
      className={isDragging ? 'opacity-60' : ''}>
      <TaskCard task={task} />
    </div>
  )
}

function DropColumn({ status, label, tasks, onOpen }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <div ref={setNodeRef} className={colCls(isOver)}>
      <Header label={label} count={tasks.length} />
      <div className="flex min-h-[60px] flex-col gap-2.5">
        {tasks.map((t) => <DraggableCard key={t.id} task={t} onOpen={onOpen} />)}
      </div>
    </div>
  )
}

export default function Board({ tasks, onMove, onOpen }) {
  // sensors: mouse needs small drag to start (so clicks open the modal); touch long-presses (so the page can still scroll)
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  )

  if (!onMove) {
    return (
      <div className={grid}>
        {STATUSES.map((s) => (
          <StaticColumn key={s.key} label={s.label} onOpen={onOpen} tasks={tasks.filter((t) => t.status === s.key)} />
        ))}
      </div>
    )
  }

  function onDragEnd({ active, over }) {
    if (!over || !active) return
    const t = tasks.find((x) => x.id === active.id)
    if (t && t.status !== over.id) onMove(active.id, over.id)
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className={grid}>
        {STATUSES.map((s) => (
          <DropColumn key={s.key} status={s.key} label={s.label} onOpen={onOpen} tasks={tasks.filter((t) => t.status === s.key)} />
        ))}
      </div>
    </DndContext>
  )
}
