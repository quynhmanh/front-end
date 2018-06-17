import React, { Component } from 'react'
import MyPurchaseCard from './my-purchase-card'

import origin from '../services/origins'

class MyPurchases extends Component {
  constructor(props) {
    super(props)

    this.loadListing = this.loadListing.bind(this)
    this.loadPurchase = this.loadPurchase.bind(this)
    this.state = { filter: 'pending', purchases: [], loading: true }
  }

  async componentWillReceiveProps() {
    await this.getListingIds()
  }

  /*
  * WARNING: These functions don't actually return what they might imply.
  * They use return statements to chain together async calls. Oops.
  *
  * For now, we mock a getByPurchaserAddress request by fetching all
  * listings individually and fetching all related purchases individually.
  */

  async getListingIds() {
    try {
      const ids = await origin.listings.allIds()

      return await Promise.all(ids.map(this.loadListing))
    } catch(error) {
      console.error('Error fetching listing ids')
    }
  }

  async getPurchaseAddress(addr, i) {
    try {
      const purchAddr = await origin.listings.purchaseAddressByIndex(addr, i)

      return this.loadPurchase(purchAddr)
    } catch(error) {
      console.error(`Error fetching purchase address at: ${i}`)
    }
  }

  async getPurchasesLength(addr) {
    try {
      const len = await origin.listings.purchasesLength(addr)
      console.log('length', len)
      if (!len) {
        return len
      }

      return await Promise.all([...Array(len).keys()].map(i => this.getPurchaseAddress(addr, i)))
    } catch(error) {
      console.error(`Error fetching purchases length for listing: ${addr}`)
    }
  }

  async loadListing(id) {
    try {
      const listing = await origin.listings.getByIndex(id)

      
      return this.getPurchasesLength(listing.address)
    } catch(error) {
      console.error(`Error fetching contract or IPFS info for listingId: ${id}`)
    }
  }

  async loadPurchase(addr) {
    try {
      const purchase = await origin.purchases.get(addr)
      const accounts = await origin.contractService.web3.eth.getAccounts();

      if (purchase.buyerAddress === accounts[this.props.id]) {
        const purchases = [...this.state.purchases, purchase]

        this.setState({ purchases })
      }

      return purchase
    } catch(error) {
      console.error(`Error fetching purchase: ${addr}`, error)
    }
  }

  async componentWillMount() {
    await this.getListingIds()

    this.setState({ loading: false })
  }

  render() {
    const { filter, loading, purchases } = this.state
    const filteredPurchases = (() => {
      switch(filter) {
        case 'pending':
          return purchases.filter(p => p.stage !== 'complete')
        case 'complete':
          return purchases.filter(p => p.stage === 'complete')
        default:
          return purchases
      }
    })()

    return (
      <div className="my-purchases-wrapper">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <h2>My Purchases</h2>
            </div>
          </div>
          <div className="row">
            <div className="col-12">
              <div className="my-listings-list">
                {purchases.map(p => <MyPurchaseCard key={`my-purchase-${p.address}`} purchase={p} />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default MyPurchases
