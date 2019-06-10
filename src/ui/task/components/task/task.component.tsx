import { K, Streamify, reduce, TargetKeyboardEvent, createHandler } from '../../../../utils';
import * as React from 'react';
import cx from 'classnames';
import { ChangeEvent, createRef, FocusEvent, MouseEvent } from 'react';
import { compose, constVoid } from 'fp-ts/lib/function';
import { Lens } from 'monocle-ts';
import { Stream } from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';

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
	const [handleDestroyClick, destroyClickEvent] = createHandler<MouseEvent<HTMLButtonElement>>();
	const [handleToggleChange, toggleChangeEvent] = createHandler<ChangeEvent<HTMLInputElement>>();
	const [handleTitleDoubleClick, titleDoubleClick] = createHandler<MouseEvent<HTMLLabelElement>>();
	const [handleEditKeyUp, editKeyUpEvent] = createHandler<TargetKeyboardEvent<HTMLInputElement>>();
	const [handleEditBlur, editBlurEvent] = createHandler<FocusEvent<HTMLInputElement>>();

	const vdom = K(props.value, ({ title, completed, editing }) => {
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
					type="text"
					className={'edit'}
					ref={editInputRef}
					onKeyUp={handleEditKeyUp}
					onBlurCapture={handleEditBlur}
				/>
			</li>
		);
	});

	const destroy = destroyClickEvent.map(constVoid);

	const value: Stream<TaskValue> = reduce(
		props.value,
		titleDoubleClick.mapTo(editingLens.set(true)),
		editKeyUpEvent.filter(e => e.keyCode === ESC_KEY).mapTo(editingLens.set(true)),
		toggleChangeEvent
			.map(e => e.target.checked)
			.compose(dropRepeats())
			.map(completedLens.set),
		Stream.merge(editKeyUpEvent.filter(e => e.keyCode === ENTER_KEY), editBlurEvent)
			.map(e => e.target.value)
			.compose(dropRepeats())
			.map(value =>
				compose(
					editingLens.set(false),
					titleLens.set(value),
				),
			),
	);

	return { vdom, value, destroy };
};
