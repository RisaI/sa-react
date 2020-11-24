import * as React from 'react';
import { DataService, DialogService } from '../services';
import LdevMapModal from './Modals/LdevMapModal';

import './TraceList.css';

const buttons: { label: string, action: TraceAction }[][] = [
    [
        { label: 'Filter', action: 'filter' },
        { label: 'SelUniq', action: 'sel-unq' },
        { label: 'Search', action: 'search' },
        { label: 'Thres', action: 'tres' }
    ],
    [
        { label: 'AllSel', action: 'sel-all' },
        { label: 'InvSel', action: 'inv' },
        { label: 'DeSel', action: 'des' },
        { label: 'DelZero', action: 'del-zero' }
    ],
    [
        { label: 'Sum', action: 'sum' },
        { label: 'Average', action: 'avg' },
        { label: 'DelUnsel', action: 'del-unsel' },
        { label: 'Sort', action: 'sort' } ],
    [
        { label: 'Name Sync', action: 'name-sync' },
        { label: 'Bind Sync', action: 'bind-sync' },
        { label: 'Zoom Sync', action: 'zoom-sync' }
    ],
    // { label: 'DelSel', action: 'del-sel' },
];

// TODO: LDEV map button

class TraceList
extends React.PureComponent<Props, State> {
    public state: State = {
        sources: []
    };

    public componentDidMount() {
        DataService.getSources().then(sources => this.setState({ sources }));
    }

    traceClicked = (e: React.MouseEvent<HTMLLIElement>) => {
        const id = e.currentTarget.dataset.id as Trace['id'];
        this.props.onSelect(id);
    }

    actionClicked = (e: React.MouseEvent<HTMLButtonElement>) => {
        const action = e.currentTarget.dataset.action as TraceAction;
        this.props.onAction(action);
    }


    hasLdevMaps = (trace: Trace) => {
        if (!this.state.sources || trace.pipeline.type !== 'data' ||
            !(trace.pipeline as DataNodeDescriptor).dataset.id.startsWith('LDEV')) {
            return;
        }

        const source = this.state.sources.find(s => s.id === (trace.pipeline as DataNodeDescriptor).dataset.source);

        return source && source.features.indexOf('ldev_map') >= 0;
    }

    getLdevId = (trace: Trace) => {
        const { dataset } = (trace.pipeline as DataNodeDescriptor);
        return [ dataset.source, dataset.variant! ];
    }

    onLdevClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        const trace = this.props.traces.find(t => t.id === e.currentTarget.dataset.trace);
        
        if (trace) {
            const ldevId = this.getLdevId(trace);
    
            DialogService.open(LdevMapModal, () => {}, { source: ldevId[0], ldev: ldevId[1] });
        }
    }

    public render() {
        const { traces, selected } = this.props;

        return (
            <>
                <div>
                {buttons.map((row, i) => (
                    <div key={i} className='btn-group btn-group-stretch'>
                    {row.map(btn => (
                        <button className='btn btn-secondary btn-sm' key={btn.action} data-action={btn.action} onClick={this.actionClicked}>{btn.label}</button>
                    ))}
                    </div>
                ))}
                </div>
                <ul className='list-group'>
                {traces.map(t => (
                    <li
                        key={t.id}
                        data-id={t.id}
                        className={`list-group-item list-group-item-action ${selected.indexOf(t.id) >= 0 ? 'active' : ''}`}
                        onClick={this.traceClicked}
                    >
                    {t.title} {this.hasLdevMaps(t) ? (<button className='btn' data-trace={t.id} onClick={this.onLdevClick}>(I)</button>) : undefined}
                    </li>
                ))}
                </ul>
            </>
        );
    }
}

export interface Props {
    traces: Trace[];
    selected: Trace['id'][];

    onSelect(id: Trace['id']): void;
    onAction(action: TraceAction): void;
}

export interface State {
    sources: DataSource[];
}

export default TraceList;