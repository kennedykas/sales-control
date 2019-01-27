import React, { Component } from 'react';
import Button            from '@material-ui/core/Button';
import Table             from '@material-ui/core/Table';
import TableBody         from '@material-ui/core/TableBody';
import TableCell         from '@material-ui/core/TableCell';
import TableHead         from '@material-ui/core/TableHead';
import TableRow          from '@material-ui/core/TableRow';
import Paper             from '@material-ui/core/Paper';
import MoneyOffIcon      from '@material-ui/icons/MoneyOff';
import AddIcon           from '@material-ui/icons/Add';
import Clear             from '@material-ui/icons/Clear';
import Dialog            from '@material-ui/core/Dialog';
import DialogActions     from '@material-ui/core/DialogActions';
import DialogContent     from '@material-ui/core/DialogContent';
import DialogTitle       from '@material-ui/core/DialogTitle';
import { ItemDialog }    from './common/ItemDialog';
import DialogContentText from '@material-ui/core/DialogContentText';

export class CustomerBill extends Component {

    constructor(props) {
        super(props);
        this.state = {
            client      : { id: null, name: '', phone: '', email: '', 'register-date': '' },
            managingItem: false,
            paying      : false,
            cleaningUp  : false,
            total       : 0,
            items       : [],
            item        : {},
            selectedRow : undefined
        };

        this.toggleItemDialog  = this.toggleItemDialog.bind(this);
        this.componentDidMount = this.componentDidMount.bind(this);
        this.intl  = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
        this.intl2 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

        this.keyboardShortcuts();
    }

    componentDidMount() {

        this.setState(
            { 'client': JSON.parse(localStorage.getItem('client')) },

            function() {

                if (this.state.client && this.state.client.id)
                    this.getSales();
                else
                    this.getClient();
            }
        );
    }

    getSales() {

        fetch(`http://localhost:3000/api/xjoin?_join=s.sales,_j,p.products&_on1=(s.product,eq,p.id)&_fields=s.id,s.date,s.quantity,s.payment,p.id,p.value,p.name&_where=(s.client,like,${this.state.client.id}~)&_sort=s.date,s.id`)
        .then(res => res.json())
        .then(
            (result) => {
                this.setState({ isLoaded: true, items: result });
            },
            (error) => {
                this.setState({ isLoaded: true, error });
            }
        );
    }

    getClient() {

        fetch('http://localhost:3000/api/clients?_sort=-id')
        .then(res => res.json())
        .then(
            (result) => {
                this.setState({ client: result[0] }, () => {
                    localStorage.setItem('client', JSON.stringify(result[0]));
                });
                this.getSales();
            },
            (error)  => { this.setState({ error }); }
        );
    }

    render() {
        let root = this;
        const { error, isLoaded, items} = this.state;

        if (error)
            return <div>Error: { error.message }</div>;

        else if (!isLoaded)
            return <div>Loading...</div>;

        else {
            return (
            <>
            <section className="customer-bill">
                <header>
                    <h1 className="title">{ this.state.client.name } { this.clientStatus() }</h1>
                    <strong>*Importante, o valor dos produtos está sujeito a reajustes sem aviso prévio.</strong>
                </header>

                <section className="customer-bill__items">

                    <h2 hidden={this.state.items.length} className="empty">
                        Nada encontrado.
                    </h2>

                    <Paper hidden={ !this.state.items.length }>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell numeric>Quantidade</TableCell>
                                    <TableCell>Produto</TableCell>
                                    <TableCell>Data</TableCell>
                                    <TableCell numeric>Unitário (R$)</TableCell>
                                    <TableCell numeric>Total (R$)</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                            { items.map(function(item, i) { return (
                                <TableRow
                                    onClick ={ e => root.editRowInfo(e) }
                                    selected={ root.state.selectedRow === i }
                                    hover   ={ true }
                                    key     ={ i }>
                                    <TableCell numeric>{ item.s_quantity }</TableCell>
                                    <TableCell>{ item.p_name }</TableCell>
                                    <TableCell>{ new Date(item.s_date).toLocaleString() }</TableCell>
                                    <TableCell numeric>
                                        { item.p_value ? root.intl.format(item.p_value) : '' }
                                    </TableCell>
                                    <TableCell numeric>
                                        { item.p_value ?
                                                root.intl.format(item.s_quantity * item.p_value) :
                                                root.intl.format(item.s_payment) }
                                    </TableCell>
                                </TableRow>
                            );})}
                            </TableBody>
                        </Table>
                    </Paper>
                </section>

                <div className="customer-bill__actions">
                    <Button
                        variant="outlined"
                        color  ="primary"
                        onFocus={ () => this.unselectRows() }
                        onClick={ () => this.showNewItemDialog() }>
                        <AddIcon />
                        ADICIONAR ITENS
                    </Button>
                    <Button
                        variant="outlined"
                        color  ="primary"
                        onClick={ () => this.showNewPaymentDialog() }>
                        <MoneyOffIcon />
                        PAGAR
                    </Button>
                    <Button
                        variant ="outlined"
                        color   ="secondary"
                        disabled={ !this.state.items.length }
                        onClick ={ () => this.toggleClearDialog() }>
                        <Clear />
                        LIMPAR
                    </Button>
                </div>

                <ItemDialog
                    refresh={ this.componentDidMount }
                    open   ={ this.state.managingItem }
                    close  ={ this.toggleItemDialog }
                    item   ={ this.state.item } />

                <Dialog open={ this.state.cleaningUp }>
                    <DialogTitle>Limpar itens</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Limpar todos os registros de pagamentos e produtos deste cliente?
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={ () => this.toggleClearDialog() }
                            color="secondary" autoFocus={ true }>
                            CANCELAR
                        </Button>
                        <Button onClick={ () => this.deleteClientItems() } color="primary">
                            LIMPAR
                        </Button>
                    </DialogActions>
                </Dialog>
            </section>
            </>
            )
        }
    }

    showNewItemDialog() {

        const item = {};
        item.s_quantity = 1;

        this.setState({ 'item': item }, function() {
            this.toggleItemDialog();
        });
    }

    toggleItemDialog() {
        this.setState({ managingItem: !this.state.managingItem });
    }

    showNewPaymentDialog() {
        this.setState({ item: {} }, function(){
            this.toggleItemDialog();
        });
    }

    toggleClearDialog() {

        this.setState({ cleaningUp: !this.state.cleaningUp });

        let root = this;

        setTimeout(function() {
            root.setState({ cleaningUp: false });
        }, 5000);
    };

    editRowInfo(e) {

        const id   = e.currentTarget.rowIndex - 1;
        const item = this.state.items[id];

        this.setState({ 'item': item }, function() {
            this.toggleItemDialog();
        });
    }

    clientStatus() {

        const total = this.getTotal();
        let message;

        if (total < 0)
            message = ` - Nós te devemos ${this.intl2.format(total * -1)}`;
        else if (total > 0)
            message = ` - Total: ${this.intl2.format(total)}`;

        return message;
    }

    getTotal() {

        const total =
            this.state.items.reduce(function (sum, items) {
                return sum + (items.s_payment + (items.p_value * items.s_quantity));
            }, 0);

        return total;
    }

    deleteClientItems() {

        this.setState({ isLoaded: false });

        const ids =
            this.state.items.reduce(function (ids, items) {
                return ids += ',' + items.s_id;
            }, 0);

        fetch(`http://localhost:3000/api/sales/bulk?_ids=${ids}`, { method : "DELETE" })
        .then(res => res.json())
        .then(
            (result) => {
                this.componentDidMount();
                this.toggleClearDialog();
            },
            (error) => { this.setState({ isLoaded: true, error }); }
        );
    }

    keyboardShortcuts() {

        const root = this;

        document.addEventListener('keydown', function(e) {
            if (e.keyCode === 27)
                root.setState({ managingItem: false, cleaningUp: false });
            else if (e.key === 'ArrowUp' || e.key === 'ArrowDown')
                root.manageSelectedRow(e.key);
            else if (e.key === 'Enter')
                root.openRowDetails(e);
        });
    }

    manageSelectedRow(key) {

        if (key === 'ArrowUp') {
            if (this.state.selectedRow > 0)
                this.setState({ selectedRow: this.state.selectedRow - 1 });

        } else if (this.state.selectedRow === undefined) {
            this.setState({ selectedRow: 0 });

        } else {
            if (this.state.selectedRow < (this.state.items.length - 1))
                this.setState({ selectedRow: this.state.selectedRow + 1 });
        }
    }

    openRowDetails(e) {

        if (!this.state.managingItem && this.state.selectedRow) {
            e.preventDefault();
            document.querySelector('tbody').children[this.state.selectedRow].children[0].click();
        }
    }

    unselectRows() {
        this.setState({ selectedRow: undefined });
    }
}
