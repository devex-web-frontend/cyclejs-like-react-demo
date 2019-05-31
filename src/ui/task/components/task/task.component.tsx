import { K, pipe, Streamify, reduce, mapTo, TargetKeyboardEvent, voidSink, log } from '../../../../utils';
import * as React from 'react';
import cx from 'classnames';
import { createAdapter } from '@most/adapter/dist';
import { ChangeEvent, createRef, FocusEvent, MouseEvent } from 'react';
import { compose, constVoid } from 'fp-ts/lib/function';
import { filter, map, merge } from '@most/core';
import { Lens } from 'monocle-ts';
import { Stream } from '@most/types';

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
	const [handleDestroyClick, destroyClickEvent] = createAdapter<MouseEvent<HTMLButtonElement>>();
	const [handleToggleChange, toggleChangeEvent] = createAdapter<ChangeEvent<HTMLInputElement>>();
	const [handleTitleDoubleClick, titleDoubleClick] = createAdapter<MouseEvent<HTMLLabelElement>>();
	const [handleEditKeyUp, editKeyUpEvent] = createAdapter<TargetKeyboardEvent<HTMLInputElement>>();
	const [handleEditBlur, editBlurEvent] = createAdapter<FocusEvent<HTMLInputElement>>();

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

	const value: Stream<TaskValue> = reduce(
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
			K(merge(filter(e => e.keyCode === ENTER_KEY, editKeyUpEvent), editBlurEvent), e => e.target.value),
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
