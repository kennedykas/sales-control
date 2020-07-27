import React, { Component } from 'react'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import Paper from '@material-ui/core/Paper'

export class InvoiceTable extends Component {
    constructor (props) {
        super(props)
        const options = {
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: 'numeric', second: 'numeric',
            hour12: false,
            timeZone: 'America/Sao_Paulo'
        }
        this.intl = new Intl.DateTimeFormat('pt-BR', options)
        this.intl2 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    }

    render () {
        const { items, root, client } = this.props
        return (
            <>
            <section className="customer-bill">
                <header>
                    <h2>{ client.name } { this.clientStatus() }</h2>
                    <strong>*Importante, o valor dos produtos está sujeito a reajustes sem aviso prévio.</strong>
                </header>

                <section className="customer-bill__items">

                    <h2 hidden={items.length} className="empty">
                        Nada encontrado.
                    </h2>
                    <Paper hidden={ !items.length }>
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
                            { items.map((item, i) => {
                                const backgroundColor = item.product ? '' : 'payment'
                                return (
                                    <TableRow
                                    className = {backgroundColor}
                                    onClick = { this.props.onClickRow }
                                    selected = { root.state.selectedRow === i }
                                    hover = { true }
                                    key = { i }>
                                        <TableCell numeric>{ item.amount }</TableCell>
                                        <TableCell >{ item.product ? item.product.descrition : '' }
                                        </TableCell>
                                        <TableCell>{ this.intl.format(new Date(item.createdAt)) }</TableCell>
                                        <TableCell numeric>
                                            { item.product ? this.intl2.format(item.product.price) : '' }
                                        </TableCell>
                                        <TableCell numeric>
                                            { item.product ?
                                                this.intl2.format(item.amount * item.product.price) :
                                                this.intl2.format(item.paymentAmount) }
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                            </TableBody>
                        </Table>
                    </Paper>
                </section>
            </section>
            </>
        )
    }

    clientStatus () {
        const total = this.getTotal()
        let message
        if (total < 0) message = ` - Nós te devemos ${this.intl2.format(total * -1)}`
        else if (total >= 0) message = ` - Total: ${this.intl2.format(total)}`
        return message
    }

    getTotal () {
        const total = this.props.items.reduce((sum, items) => {
            if (items.product) return sum + items.product.price * items.amount
            else return sum + parseFloat(items.paymentAmount)
        }, 0)
        return total
    }
}
