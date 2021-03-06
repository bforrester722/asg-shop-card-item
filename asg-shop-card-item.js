/**
 * `asg-shop-card-item`
 * show only vital/miminal card info and thumbnail
 * user can select this card to add to cart or open a
 * full-screen detail view
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
import {AppElement, html} from '@smyd/app-shared/app-element.js';
import {
  AsgShopCardMixin
}                 from '@smyd/asg-shop-card-shared-elements/asg-shop-card-mixin.js';
import {listen}   from '@smyd/app-functions/utils.js';
import htmlString from './asg-shop-card-item.html';
import './asg-shop-card-item-image.js';
import '@smyd/app-shared/app-icons.js';
import '@smyd/asg-icons/asg-icons.js';
import '@smyd/asg-shop-card-shared-elements/asg-shop-card-set.js';
import '@smyd/asg-shop-card-shared-elements/asg-shop-card-controls.js';
import '@smyd/asg-shop-card-shared-elements/asg-shop-sold-out-label.js';
import '@polymer/paper-icon-button/paper-icon-button.js';


class ASGShopCardItem extends AsgShopCardMixin(AppElement) {
  static get is() { return 'asg-shop-card-item'; }

  static get template() {
    return html([htmlString]);
  }


  static get properties() {
    return {

      buylistRules: Object,

      isBuylist: {
        type: Boolean, 
        value: false
      },
      // passed into asg-shop-card-item-image
      _cardImageParent: Object,

      _disableCart: Boolean,

      _quantity: Number,

      _cardImg: Object      
      
    };
  }


  constructor() {
    super();    

    this._cardImageParent = this; // for asg-shop-card-item-image
  }


  connectedCallback() {
    super.connectedCallback();
    listen(
      this, 
      'asg-shop-card-item-image-hide-actions',      
      this.__hideActions.bind(this)
    );
    listen(
      this, 
      'asg-shop-card-item-image-enter-description', 
      this.__enterDescription.bind(this)
    );
    listen(
      this, 
      'asg-shop-card-item-image-hide-description',  
      this.__hideDescription.bind(this)
    );
    listen(
      this, 
      'asg-shop-card-item-image-enter-actions',     
      this.__enterActions.bind(this)
    );
    listen(
      this, 
      'asg-card-controls-hide-add-to-cart',   
      this.__hideAddToCart.bind(this)
    );
    // fixes a bug where the description will not be displayed
    // if a card is removed from cart
    listen(
      this, 
      'asg-shop-card-controls-card-changed',   
      this.__enterDescription.bind(this)
    );    
  }

   
  __computeMultiFaceTextClass(faces) {
    return faces ? 'show-multi-face-text' : '';
  }

  
  __computePriceRange(card) {
    if (!card) { return ''; }
    const {foil, notFoil} = card;
    // favor sale price over market price
    const keys = Object.keys(foil); // foil and notFoil have same keys
    const getPrices = (type, obj) => 
                        keys.
                          map(key      => obj[key][type]).
                          filter(price => price && price !== '0').
                          map(price    => Number(price));

    const foilSales     = getPrices('sale', foil);
    const notFoilSales  = getPrices('sale', notFoil);
    const foilPrices    = getPrices('price', foil);
    const notFoilPrices = getPrices('price', notFoil);
    const allPrices     = [
      ...foilSales, 
      ...notFoilSales, 
      ...foilPrices, 
      ...notFoilPrices
    ];
    const low  = Math.min(...allPrices).toFixed(2);
    const high = Math.max(...allPrices).toFixed(2);
    if (!high || high < 0.01) { return 'Pricing Not Available'; }
    return `$${low} - $${high}`;
  }

  __computeBuylistPriceRange(card, buylistRules) {
    if (!card || !buylistRules) { return ''; }
    const buylistPercent = buylistRules.all.price;
    const {foil, notFoil} = card;
    // favor sale price over market price
    const keys = Object.keys(foil); // foil and notFoil have same keys
    const getPrices = (type, obj) => 
                        keys.
                          map(key      => obj[key][type]).
                          filter(price => price && price !== '0').
                          map(price    => Number(price) * buylistPercent / 100);

    const foilPrices    = getPrices('price', foil);
    const notFoilPrices = getPrices('price', notFoil);
    const allPrices     = [...foilPrices, ...notFoilPrices];
    const low  = Math.min(...allPrices).toFixed(2);
    const high = Math.max(...allPrices).toFixed(2);
    if (!high || high < 0.01) { return 'Pricing Not Available'; }
    return `$${low} - $${high}`;
  }


  __hideAddToCart(event) {
    const {disabled} = event.detail;
    this._disableCart = disabled;
  }

  //uses asg-shop-card-controls to get all info on selected card then fires to spriteful-app.js
  async __addToCardButtonClicked() {
    try {
      if (!this.$.detailsBtn.classList.contains('entry')) { return; }
      await this.clicked();
      const card = this.$.controls.addSelectedToCard(); // mixin
      if (this.isBuylist) {
        this.fire('asg-shop-card-item-buylist-add-to-cart', {card, buylist: true});
        return;
      }
      this.fire('asg-shop-card-item-add-to-cart', {card});
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }
  // fire event that contains the card's data, along with x,y coords for the 
  // click event, detail button, and card image.  
  // asg-shop-card-details contains clones of the icon-button and card image
  // it used the coords and clones for entry animation
  async __detailsButtonClicked(event) {
    try {
      if(!this.$.detailsBtn.classList.contains('entry')) { return; }
      await this.clicked();
      if (!this._cardImg) {
        this._cardImg = this.select('#img', this.$.img);
      }     
      const {x, y} = event;
      const image  = this._cardImg.getBoundingClientRect(); 
      const card   = this.$.controls.addSelectedToCard();

      this.fire('open-overlay', {
        card,
        id: 'cardDetails',
        image, 
        x, 
        y, 
        isBuylist:    this.isBuylist, 
        buylistRules: this.buylistRules
      });
    }
    catch (error) {
      if (error === 'click debounced') { return; }
      console.error(error);
    }
  }


  __hideActions() {
    this.$.actions.classList.remove('show-content');
    this.$.actionsMask.classList.remove('hide-fade-gradient-mask');
    this.$.addToCartBtn.classList.remove('entry');
    this.$.detailsBtn.classList.remove('entry');
    this.$.controls.hideActions();
  }
  

  __enterDescription() {
    this.$.description.classList.add('show-content');
    this.$.descriptionMask.classList.add('hide-fade-gradient-mask');
    this.$.title.classList.add('entry');
    this.$.set.classList.add('entry');
    this.$.multiFaceText.classList.add('entry');
    this.$.priceRange.classList.add('entry');
  }


  __hideDescription() {
    this.$.description.classList.remove('show-content');
    this.$.descriptionMask.classList.remove('hide-fade-gradient-mask');
    this.$.title.classList.remove('entry');
    this.$.set.classList.remove('entry');
    this.$.multiFaceText.classList.remove('entry');
    this.$.priceRange.classList.remove('entry');
  }


  __enterActions() {
    this.$.actions.classList.add('show-content');
    this.$.actionsMask.classList.add('hide-fade-gradient-mask');
    if (!this._disableCart) {
      this.$.addToCartBtn.classList.add('entry');
    }
    this.$.detailsBtn.classList.add('entry');
    this.$.controls.enterActions();
  }

}

window.customElements.define(ASGShopCardItem.is, ASGShopCardItem);
