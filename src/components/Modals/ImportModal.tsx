
import * as React from 'react';
import { Button, Col, ModalTitle, Row, Form } from 'react-bootstrap';
import Tree, { TreeNode } from 'rc-tree';
import { ModalComponent } from '.';
import { DataService, Deserialization } from '../../services';
import DateRangePicker from 'react-bootstrap-daterangepicker';

import 'rc-tree/assets/index.css';
import 'bootstrap-daterangepicker/daterangepicker.css';

class InfoModal
extends ModalComponent<ImportResult, Args, State> {
    public state: State = {
        title: 'Nový graf',
        xLabel: 'osa x',
        yLabel: 'osa y',

        startDate: new Date(),
        endDate: new Date(),

        minDate: undefined,
        maxDate: undefined,

        selected: [],
    };

    public componentDidMount() {
        DataService.getSources().then(this.loadTraces);
    }

    private sourceMap: { [key: string]: Dataset } = {};
    private loadTraces = (sources: DataSource[]) => {
        this.sourceMap = {};
        sources.forEach(s => s.datasets.forEach(d => {
            this.sourceMap[`${s.id}::${d.id}`] = d;
        }))
        this.setState({ sources })
    }

    protected renderHeader(): JSX.Element {
        const { isGraph } = this.props.args;
        return (
            <ModalTitle>{isGraph ? 'Přidat graf' : 'Importovat křivku'}</ModalTitle>
        );
    }

    private onCheck = (selected: React.ReactText[]) => {
        selected = selected.filter(s => s in this.sourceMap);
        let additional: Partial<Pick<State, 'minDate' | 'maxDate'>> = {};
        
        if (this.state.selected.length <= 0 && selected.length > 0) {
            additional = {
                minDate: Deserialization.parseTimestamp(Math.max(...selected.map(t => this.sourceMap[t].availableXRange[0]))),
                maxDate: Deserialization.parseTimestamp(Math.min(...selected.map(t => this.sourceMap[t].availableXRange[1]))),
            };
            // this.timeRange = [ this.minDate, this.maxDate ];
        } else if (selected.length <= 0) {
            additional = { maxDate: undefined, minDate: undefined };
        }

        this.setState({ ...additional, selected: selected as string[] });
    }
    private onFormChange = (e: React.ChangeEvent<HTMLInputElement>) => this.setState({ [e.currentTarget.name]: e.currentTarget.value } as any);
    private onRangeChange = (start: any, end: any) => {
        this.setState({ startDate: start._d, endDate: end._d });
    }

    protected renderBody(): JSX.Element {
        if (!this.state.sources) {
            return <p className='text-center'>Načítám křivky...</p>;
        }

        const { isGraph } = this.props.args;
        
        return (
            <Row>
                <Col>
                    <Tree
                        checkable
                        selectable={false}
                        multiple

                        onCheck={this.onCheck as any}
                    >
                    {this.state.sources.map(s => (
                        <TreeNode key={s.id} title={s.name}>
                        {s.datasets.map(d => (
                            <TreeNode key={`${s.id}::${d.id}`} title={d.name} />
                        ))}
                        </TreeNode>
                    ))}
                    </Tree>
                </Col>
            {isGraph ? (
                <Col>
                    <Form.Group>
                        <Form.Label>Název grafu</Form.Label>
                        <Form.Control name='title' value={this.state.title} onChange={this.onFormChange}></Form.Control>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Popis osy x</Form.Label>
                        <Form.Control name='xLabel' value={this.state.xLabel} onChange={this.onFormChange}></Form.Control>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Popis osy y</Form.Label>
                        <Form.Control name='yLabel' value={this.state.yLabel} onChange={this.onFormChange}></Form.Control>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Rozmezí</Form.Label>
                        
                        <DateRangePicker
                            key={this.rangeHash()}
                            initialSettings={{
                                minDate: this.state.minDate,
                                maxDate: this.state.maxDate,
                                timePicker: true,
                                timePicker24Hour: true,
                            }}
                            onCallback={this.onRangeChange}
                        >
                            <Form.Control name='timeRange'></Form.Control>
                        </DateRangePicker>
                    </Form.Group>
                </Col>
            ) : undefined}
            </Row>
        );
    }

    private rangeHash = () => (this.state.minDate?.getTime() || 0) + (this.state.maxDate?.getTime() || 0);
    private generateTraces = (): Trace[] => this.state.selected.flatMap(s => {
        const set = this.sourceMap[s];

        if (set.variants) {
            return set.variants.map(v => ({
                id: `${s}::${v}`,
                title: `${set.name} (${v})`,
                pipeline: {
                    type: 'data',
                    dataset: {
                        source: set.source,
                        id: set.id,
                        variant: v,
                    }
                } 
            } as Trace));
        } else {
            return [ {
                id: s,
                title: set.name,
                pipeline: {
                    type: 'data',
                    dataset: {
                        source: set.source,
                        id: set.id,
                    }
                } 
            } as Trace ];
        }
    });

    private okClicked = () => this.resolve(this.props.args.isGraph ? {
        id: 0,

        title: this.state.title,
        xLabel: this.state.xLabel, 
        yLabel: this.state.yLabel,

        xRange: [
            Deserialization.dateToTimestamp(this.state.startDate),
            Deserialization.dateToTimestamp(this.state.endDate)
        ],
        traces: this.generateTraces(),
    } as Graph : this.generateTraces());
    private cancelClicked = () => this.resolve(undefined);

    protected renderFooter(): JSX.Element {
        const { isGraph } = this.props.args;

        return (
            <>
                <Button variant='primary' onClick={this.okClicked} disabled={this.state.selected.length <= 0}>
                {isGraph ? 'Přidat' : 'Importovat'}
                </Button>
                <Button variant='secondary' onClick={this.cancelClicked}>
                Zrušit
                </Button>
            </>
        );
    }
}

export interface Args {
    isGraph: boolean;
}

interface State {
    sources?: DataSource[];
    selected: string[];

    title: Graph['title'],
    xLabel: Graph['xLabel'],
    yLabel: Graph['yLabel'],

    minDate?: Date,
    maxDate?: Date,

    startDate: Date,
    endDate: Date,
}

export type ImportResult = Graph | Trace[];

export default InfoModal;