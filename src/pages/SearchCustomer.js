/* jshint esversion: 6 */
import React, { Component } from 'react';
import NavLink              from 'react-router-dom/NavLink';
import { withRouter }       from "react-router-dom";
import Button               from '@material-ui/core/Button';
import { InputList }        from './common/InputList';

export class SearchCustomer extends Component {

    constructor(props) {
        super(props);
        this.state = {
            client: { id: null, name: '', phone: '', email: '', 'register-date': '' },
            isLoaded: false,
            clients: []
        };
    }

    componentDidMount() {

        this.getClients();
    }

    getClients(page) {

        let p = page ? page : 1;
        fetch(`http://localhost:3000/api/clients?_p=${p}&_size=100`)
        .then(res => res.json())
        .then(
            (result) => {
                if (result.length) {
                    let clients = this.state.clients;
                    clients = clients.concat(result);
                    this.setState({ 'clients': clients }, () => { this.getClients(++p); });
                } else
                    this.setState({ isLoaded: true });
            },
            // Note: it's important to handle errors here
            // instead of a catch() block so that we don't swallow
            // exceptions from actual bugs in components.
            (error) => {
                this.setState({ isLoaded: true, error });
            }
        );
    }

    render() {
        const { error, isLoaded, clients} = this.state;

        if (error)
            return <div>Error: { error.message }</div>;

        else if (!isLoaded)
            return <div>Carregando...</div>;

        else {
            return (
                <section className="home">
                    <div className="search-customer">
                        <InputList
                            value    ={ this.state.client.name }
                            onKeyUp  ={ e => this.setClient(e) }
                            onKeyDown={ e => this.openClientDetails(e) }
                            onChange ={ e => this.setClient(e) }
                            id       ="client"
                            label    ="Nome"
                            autoFocus={true}
                            listItems={clients} />

                        <Button
                            variant="outlined"
                            color  ="primary"
                            onClick={ () => this.newClient() }>
                            NOVO
                        </Button>
                    </div>
                    <div>
                        <NavLink to="/products">
                            <Button color="secondary">PRODUTOS</Button>
                        </NavLink>
                        {/* <NavLink to="/customer/new">
                            <Button color="secondary">RELATÓRIO</Button>
                        </NavLink> */}
                    </div>
                </section>
            )
        }
    }

    setClient(e) {

        let client       = this.state.client;
        let clientOption = (!e.target.value) ?
            null : document.querySelector('#items option[value="' + e.target.value + '"]');

        client.name = e.target.value.toUpperCase();
        client.id   = clientOption ? clientOption.dataset.key : null;

        this.setState({ 'client': client }, () => {
            localStorage.setItem('client', JSON.stringify(client));
        });
    }

    openClientDetails(e) {
        if (e.key === 'Enter') {
            if (this.state.client.id)
                this.props.history.push('/customer/details');
            else {
                this.setClient(e);
                this.props.history.push('/customer/new');
                e.preventDefault();
            }
        }
    }

    newClient() {
        localStorage.setItem('client', JSON.stringify(this.state.client));
        this.props.history.push('/customer/new');
        return false;
    }
}

export default withRouter(SearchCustomer);