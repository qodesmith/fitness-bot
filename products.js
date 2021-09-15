const price = '.price-box'
const availability = '.availability span'
const title = '.product-name h1'


export default [
  {
    url: 'https://www.repfitness.com/rep-power-rack-2354',
    originalPrice: 275,
    selectors: {
      price,
      availability,
      title,
    },
  },
  {
    url: 'https://www.repfitness.com/rep-lat-pull-down-low-row-attachment',
    originalPrice: 149,
    selectors: {
      price,
      availability,
      title,
    },
  },
  {
    url: 'https://www.repfitness.com/rep-power-rack-dip-attachment',
    originalPrice: 50,
    selectors: {
      price,
      availability,
      title,
    },
  },
  {
    url: 'https://www.repfitness.com/rep-iron-plates',
    originalPrice: 379,
    selectors: {
      // price: `.grouped-items-table tbody tr.last ${price}`,
      price: '#product-price-2121 > span',
      availability,
      title,
    },
    titleAddon: '(355 lb set)',
  },
  // { // Found on amazon waaaay cheaper.
  //   url: 'https://www.repfitness.com/rep-dumbbell-rack',
  //   originalPrice: 139,
  //   selectors: {
  //     price,
  //     availability,
  //     title,
  //   },
  // },
  {
    url: 'https://www.repfitness.com/rep-ab3000-fid-adj-bench',
    originalPrice: 249,
    selectors: {
      price,
      availability,
      title,
    },
  },
  {
    url: 'https://www.repfitness.com/rep-basic-barbell',
    originalPrice: 89,
    selectors: {
      price,
      availability,
      title,
    },
  },
].filter(x => !x.x) // Add `x: true` and remove the `!` here to test a single product.
