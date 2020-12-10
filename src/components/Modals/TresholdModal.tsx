
import * as React from 'react';
import { Button, ModalTitle } from 'react-bootstrap';
import { Form } from 'react-bootstrap';
import { ModalComponent } from '.';

class TresholdModal
extends ModalComponent<number, Args, State> {
    public state: State = {
        val: 0
    };

    protected renderHeader(): JSX.Element {
        return (
            <ModalTitle>Zvolit křivky větší než</ModalTitle>
        );
    }

    onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ val: Number.parseFloat(event.currentTarget.value) });
    }

    protected renderBody(): JSX.Element {
        return (
            <Form>
                <Form.Group>
                    <Form.Label>Hodnota:</Form.Label>
                    <Form.Control placeholder="Hledat..." type="number" value={this.state.val} onChange={this.onChange} />
                </Form.Group>
            </Form>
        );
    }

    private cancelClicked = () => this.resolve(undefined);
    private okClicked = () => this.resolve(this.state.val);

    protected renderFooter(): JSX.Element {
        return (
            <>
                <Button variant='primary' onClick={this.okClicked}>
                Zvolit
                </Button>
                <Button variant='secondary' onClick={this.cancelClicked}>
                Zrušit
                </Button>
            </>
        );
    }
}

export interface Args {
    
}

interface State {
    val: number;
}

export default TresholdModal;