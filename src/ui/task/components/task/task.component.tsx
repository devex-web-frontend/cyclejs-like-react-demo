import { K, Streamify, reduce, TargetKeyboardEvent, createHandler } from '../../../../utils';
import * as React from 'react';
import cx from 'classnames';
import { ChangeEvent, createRef, FocusEvent, MouseEvent } from 'react';
import { constVoid } from 'fp-ts/lib/function';
import { Lens } from 'monocle-ts';
import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import sampleCombine from 'xstream/extra/sampleCombine';

const ESC_KEY = 27;
const ENTER_KEY = 13;

export type TaskValue = {
	title: string;
	completed: boolean;
	editing: boolean;
};

const completedLens = Lens.fromProp<TaskValue>()('completed');
const editingLens = Lens.fromProp<TaskValue>()('editing');
const titleLens = Lens.fromProp<TaskValue>()('title');

type Props = {
	value: TaskValue;
};

export const Task = (props: Streamify<Props>) => {
	const editInputRef = createRef<HTMLInputElement>();
	const handleDestroyClick = createHandler<MouseEvent<HTMLButtonElement>>();
	const handleToggleChange = createHandler<ChangeEvent<HTMLInputElement>>();
	const handleTitleDoubleClick = createHandler<MouseEvent<HTMLLabelElement>>();
	const handleEditKeyUp = createHandler<TargetKeyboardEvent<HTMLInputElement>>();
	const handleEditBlur = createHandler<FocusEvent<HTMLInputElement>>();
	const handleEditChange = createHandler<ChangeEvent<HTMLInputElement>>();

	const title = xs.merge(K(handleEditChange, e => e.target.value), K(props.value, value => value.title));

	const vdom = K(props.value, title, ({ completed, editing }, title) => {
		const todoRootClassName = cx('todoRoot', {
			completed,
			editing,
		});

		return (
			<li className={todoRootClassName}>
				<div className={'view'}>
					<input type="checkbox" className={'toggle'} checked={completed} onChange={handleToggleChange} />
					<label onDoubleClick={handleTitleDoubleClick}>{title}</label>
					<button className={'destroy'} onClick={handleDestroyClick} />
				</div>
				<input
					value={title}
					onChange={handleEditChange}
					autoFocus={editing}
					type="text"
					className={'edit'}
					ref={editInputRef}
					onKeyUp={handleEditKeyUp}
					onBlurCapture={handleEditBlur}
				/>
			</li>
		);
	});

	const setEditingTrue = editingLens.set(true);
	const setEditingFalse = editingLens.set(false);

	const destroy = handleDestroyClick.map(constVoid);
	const enterKeyUp = handleEditKeyUp.filter(e => e.keyCode === ENTER_KEY);

	const value = reduce(
		props.value,
		handleTitleDoubleClick.mapTo(setEditingTrue),
		handleEditKeyUp.filter(e => e.keyCode === ESC_KEY).mapTo(setEditingTrue),
		handleToggleChange
			.map(e => e.target.checked)
			.compose(dropRepeats())
			.map(completedLens.set),
		xs.merge(enterKeyUp, handleEditBlur).mapTo(setEditingFalse),
		xs
			.merge(enterKeyUp, handleEditBlur)
			.compose(sampleCombine(title))
			.map(([_, n]) => titleLens.set(n)),
	);

	return { vdom, value, destroy };
};
