import React, { Component } from 'react'
import { InvoiceTable } from '../pages/common/InvoiceTable'

export class ClientSideCustumerBill extends Component {
    constructor (props) {
        super(props)
        this.state = {
            client: { _id: '', name: '' },
            items: [],
            item: {},
            isLoaded: false
        }
    }

    componentDidMount () {
        this.getUser()
    }

    render () {
        const isLoaded = this.state.isLoaded
        if (!isLoaded) return <div>Carregando...</div>
        else {
            return (
                <>
                    <InvoiceTable root = {this} items = {this.state.items} client = {this.state.client}/>
                </>
            )
        }
    }

    getUser () {
        const url = window.location.hash.slice(1)
        const helper = url.split('?')
        const pieces = helper[1].split('&')
        const customer = {}
        pieces.forEach((piece) => {
            const keyValue = piece.split('=')
            const key = keyValue[0]
            var value = keyValue[1]
            customer[key] = value
        })
        this.setState({ client: customer }, (custumer) => {
            this.getUserName(customer)
            this.getSales()
        })
    }

    getUserName (userId) {
        const myHeaders = new Headers()
        myHeaders.append('Content-Type', 'application/json')
        myHeaders.append('disconnected', 'true')
        fetch(`${process.env.REACT_APP_API_URL}/api/billCustomer?userId=${this.state.client._id}`, {
            method: 'GET',
            headers: myHeaders
        })
        .then(res => res.json())
        .then(
            result => { this.setState({ client: result }) },
            error => { console.log(error) }
        )
    }

    getSales (page) {
        let p = page ? page : 1
        const myHeaders = new Headers()
        myHeaders.append('Content-Type', 'application/json')
        myHeaders.append('disconnected', 'true')
        fetch(`${process.env.REACT_APP_API_URL}/api/billCustomer?userId=${this.state.client._id}&page=${p}&limit=15`, {
            method: 'GET',
            headers: myHeaders
        })
        .then(res => res.json())
        .then(
            (result) => {
                if (result.length) {
                    let items = this.state.items
                    items = items.concat(result)
                    this.setState({ items: items }, () => { this.getSales(++p) })
                } else this.setState({ isLoaded: true })
            },
            (error) => { console.log(error) }
        )
    }
}
