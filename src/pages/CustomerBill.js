/* jshint esversion: 6 */
import React, { Component } from 'react'
import Button from '@material-ui/core/Button'
import MoneyOffIcon from '@material-ui/icons/MoneyOff'
import AddIcon from '@material-ui/icons/Add'
import Snackbar from '@material-ui/core/Snackbar'
import Clear from '@material-ui/icons/Clear'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import { ItemDialog } from './common/ItemDialog'
import DialogContentText from '@material-ui/core/DialogContentText'
import ManageResponse from './common/ManageResponse'
import FileCopyOutlinedIcon from '@material-ui/icons/FileCopyOutlined';
import { InvoiceTable } from '../pages/common/InvoiceTable'
export class CustomerBill extends Component {
    constructor (props) {
        super(props)
        this.state = {
            client: { _id: null, name: '', phone: '', email: '', createAt: '' },
            managingItem: false,
            paying: false,
            cleaningUp: false,
            total: 0,
            items: [],
            item: {},
            selectedRow: undefined,
            toast: { open: false, message: '' }
        }
        this.toggleItemDialog = this.toggleItemDialog.bind(this)
        this.componentDidMount = this.componentDidMount.bind(this)
        const options = {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            hour12: false,
            timeZone: 'America/Sao_Paulo'
        }
        this.intl = new Intl.DateTimeFormat('pt-BR', options)
        this.intl2 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
        this.keyboardShortcuts()
        this.unselectRows()
    }

    componentDidMount () {
        this.unselectRows()
        this.setState(
            { client: JSON.parse(localStorage.getItem('client')), items: [] },
            () => {
                if (this.state.client && this.state.client._id) this.getSales()
                else this.getClient()
            }
        )
    }

    getSales (page) {
        let p = page ? page : 1
        const myHeaders = new Headers()
        myHeaders.append('Authorization', sessionStorage.getItem('authToken'))
        myHeaders.append('Content-Type', 'application/json')
        fetch(`http://localhost:3001/api/bills?userId=${this.state.client._id}&page=${p}&limit=15`, {
            method: 'GET',
            headers: myHeaders
        })
        .then(res => ManageResponse.checkStatusCode(res))
        .then(
            (result) => {
                if (result.length) {
                    let items = this.state.items
                    items = items.concat(result)
                    this.setState({ items: items }, () => { this.getSales(++p) })
                } else this.setState({ isLoaded: true })
            },
            () => { this.handleResult() }
        )
    }

    getClient () {
        fetch('http://localhost:3001/api/clients?_sort=-id')
        .then(res => res.json())
        .then(
            (result) => {
                this.setState({ client: result[0] }, () => {
                    localStorage.setItem('client', JSON.stringify(result[0]))
                })
                this.getSales()
            },
            (error) => { this.setState({ error }) }
        )
    }

    render () {
        const { error, isLoaded } = this.state
        if (error) this.componentDidMount()
        else if (!isLoaded) return <div>Carregando...</div>
        else {
            return (
                <>
                    <section className="customer-bill">
                        <InvoiceTable
                            root = {this}
                            items = {this.state.items}
                            client = {this.state.client}
                            onClickRow = { e => this.editRowInfo(e) }>
                        </InvoiceTable>
                        <div className = "customer-bill__actions">
                            <Button
                                variant = "outlined"
                                color = "primary"
                                onFocus = { () => this.unselectRows() }
                                onClick = { () => this.showNewItemDialog() }>
                                <AddIcon />
                                ADICIONAR ITENS
                            </Button>
                            <Button
                                variant = "outlined"
                                color = "primary"
                                onClick = { () => this.showNewPaymentDialog() }>
                                <MoneyOffIcon />
                                PAGAR
                            </Button>
                            <Button
                                variant = "outlined"
                                color = "secondary"
                                disabled = { !this.state.items.length }
                                onClick = { () => this.toggleClearDialog() }>
                                <Clear />
                                LIMPAR
                            </Button>
                            <Button
                                className = 'copyButton'
                                onClick = { () => this.copyUrl() }
                                tabIndex = '-1'>
                                    <FileCopyOutlinedIcon/>
                            </Button>
                        </div>

                        <ItemDialog
                            refresh = { this.componentDidMount }
                            open = { this.state.managingItem }
                            close = { this.toggleItemDialog }
                            item = { this.state.item } />

                        <Dialog open = { this.state.cleaningUp }>
                            <DialogTitle>Limpar itens</DialogTitle>
                            <DialogContent>
                                <DialogContentText>
                                    Limpar todos os registros de pagamentos e produtos deste cliente?
                                </DialogContentText>
                            </DialogContent>
                            <DialogActions>
                                <Button
                                    onClick = { () => this.toggleClearDialog() }
                                    color = "secondary" autoFocus={ true }>
                                    CANCELAR
                                </Button>
                                <Button onClick = { () => this.deleteClientItems() } color="primary">
                                    LIMPAR
                                </Button>
                            </DialogActions>
                        </Dialog>
                    </section>
                    <Snackbar
                        anchorOrigin = {{ vertical: 'top', horizontal: 'right' }}
                        open = { this.state.toast.open }
                        onClose = { () => this.closeToast() }
                        message = { this.state.toast.message }
                        autoHideDuration = { 3500 } />
                </>
            )
        }
    }

    copyUrl () {
        navigator.clipboard.writeText(`http://localhost:3001/#/bill?_id=${this.state.client._id}`)
    }

    closeToast () {
        const toast = this.state.toast
        toast.open = false
        this.setState({ toast: toast })
    }

    showNewItemDialog () {
        const item = {}
        item.amount = 1
        this.setState({ item: item }, () => this.toggleItemDialog())
    }

    toggleItemDialog () {
        this.setState({ managingItem: !this.state.managingItem })
    }

    showNewPaymentDialog () {
        this.setState({ item: {} }, () => this.toggleItemDialog())
    }

    toggleClearDialog () {
        this.setState({ cleaningUp: !this.state.cleaningUp })
        const root = this
        setTimeout(() => root.setState({ cleaningUp: false }), 5000)
    }

    editRowInfo (e) {
        const id = e.currentTarget.rowIndex - 1
        const item = this.state.items[id]
        this.setState({ item: item }, () => this.toggleItemDialog())
    }

    deleteClientItems () {
        this.setState({ isLoaded: false })
        fetch('http://localhost:3001/api/bills/', {
            method: 'PATCH',
            body: JSON.stringify({ customer: JSON.parse(localStorage.getItem('client'))._id }),
            headers: { 'Content-Type': 'application/json', Authorization: sessionStorage.getItem('authToken') }
        })
        .then(res => ManageResponse.checkStatusCode(res))
        .then(
            result => {
                this.handleResult(result)
                this.toggleClearDialog()
            },
            () => { this.handleResult() }
        )
    }

    keyboardShortcuts () {
        const root = this
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') root.setState({ managingItem: false, cleaningUp: false })
                else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') root.manageSelectedRow(e.key)
                else if (e.key === 'Enter') root.openRowDetails(e)
            })
    }

    manageSelectedRow (key) {
        if (key === 'ArrowUp') {
            if (this.state.selectedRow > 0) this.setState({ selectedRow: this.state.selectedRow - 1 })
        } else if (this.state.selectedRow === undefined) {
            this.setState({ selectedRow: 0 })
        } else {
            if (this.state.selectedRow < (this.state.items.length - 1)) this.setState({ selectedRow: this.state.selectedRow + 1 })
        }
    }

    openRowDetails (e) {
            if (!this.state.managingItem && this.state.selectedRow >= 0) {
                e.preventDefault()
                const tbody = document.querySelector('tbody')
                if (tbody) {
                    tbody.children[this.state.selectedRow].children[0].click()
                }
            }
    }

    unselectRows () {
        this.setState({ selectedRow: undefined })
    }

    handleResult (result) {
        if (result) {
            this.setState({ isLoaded: true, selectedRow: undefined })
            const toast = this.state.toast
            toast.open = true
            toast.message = result.error ? result.error : result.success
            this.setState({ toast: toast })
            this.componentDidMount()
        } else {
            this.setState({ isLoaded: true, selectedRow: undefined })
            const toast = this.state.toast
            toast.open = true
            toast.message = 'Problemas na comunicação.'
            this.setState({ toast: toast })
            this.clearState()
        }
    }
}
