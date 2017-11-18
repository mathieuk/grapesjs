const Component = require('./Component');

module.exports = Component.extend({

  defaults: { ...Component.prototype.defaults,
    type: 'text',
    droppable: '[data-datatype=mergefield]',
    editable: true,
  },

});
