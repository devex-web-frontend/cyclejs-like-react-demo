import { K, pipe, Observify, reduce, TargetKeyboardEvent, createHandler } from '../../../../utils';
import * as React from 'react';
import cx from 'classnames';
import { ChangeEvent, createRef, FocusEvent, MouseEvent } from 'react';
import { compose, constVoid } from 'fp-ts/lib/function';
import { Lens } from 'monocle-ts';
import { filter, map, mapTo } from 'rxjs/operators';
import { merge, Observable } from 'rxjs';

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

export const Task = (props: Observify<Props>) => {
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

	const destroy = pipe(
		destroyClickEvent,
		map(constVoid),
	);

	const value: Observable<TaskValue> = reduce(
		props.value,
		pipe(
			titleDoubleClick,
			mapTo(editingLens.set(true)),
		),
		pipe(
			editKeyUpEvent,
			filter(e => e.keyCode === ESC_KEY),
			mapTo(editingLens.set(true)),
		),
		pipe(
			K(toggleChangeEvent, e => e.target.checked),
			map(completedLens.set),
		),
		pipe(
			K(merge(editKeyUpEvent.pipe(filter(e => e.keyCode === ENTER_KEY)), editBlurEvent), e => e.target.value),
			map(value =>
				compose(
					editingLens.set(false),
					titleLens.set(value),
				),
			),
		),
	);

	return { vdom, value, destroy };
};
