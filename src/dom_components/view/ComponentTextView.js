import {on, off} from 'utils/mixins'

const ComponentView = require('./ComponentView');

module.exports = ComponentView.extend({

  events: {
    'dblclick': 'enableEditing',
    'keydown': function(e) {
        if (this.rteEnabled) {
            console.log(this);
            this.rte.udpatePosition();
            this.rte.udpatePosition();
        }
    },
    'dragend': function(e) {
        e.preventDefault();
        //this.activeRte.el.contentEditable = false;
    },

    // 'dragover': function(e) {
    //     e.preventDefault();
    //     e.dataTransfer.dropEffect = 'move';
    //     //this.enableEditing();
    //     this.el.contentEditable = true;
    //     this.el.focus();
    //     // this.rteEnabled = 1;
    //     // this.toggleEvents(1);
    //     let targetDoc = editor.Canvas.getBody().ownerDocument;
    //     this.updateCursorPosition(e);
    //
    //     return false;
    // },
    //
    // 'drop': function(e) {
    //     var canvasDoc = editor.Canvas.getBody().ownerDocument;
    //     var id        = e.dataTransfer.getData('mergefield');
    //     var element   = canvasDoc.getElementById(id);
    //
    //     if (!element) {
    //         console.log("Tried to drag/drop mergefield but couldnt find the element:" + id);
    //         return;
    //     }
    //     this.updateCursorPosition(e);
    //     var newHTML = element.outerHTML;
    //     element.parentNode.removeChild(element);
    //     this.activeRte.insertHTML(newHTML);
    //
    //     this.disableEditing();
    //     return false;
    // }
  },

  updateCursorPosition(evt) {
      let targetDoc = editor.Canvas.getBody().ownerDocument;
      let range = null;

      if (targetDoc.caretRangeFromPoint) { // Chrome
          range = targetDoc.caretRangeFromPoint(evt.clientX, evt.clientY);
      } else if (evt.rangeParent) { // Firefox
          range = targetDoc.createRange();
          range.setStart(evt.rangeParent, evt.rangeOffset);
      }

      var sel = editor.Canvas.getFrameEl().contentWindow.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
  },

  initialize(o) {
    ComponentView.prototype.initialize.apply(this, arguments);
    this.disableEditing = this.disableEditing.bind(this);
    const model = this.model;
    const em = this.em;
    this.listenTo(model, 'focus active', this.enableEditing);
    this.listenTo(model, 'change:content', this.updateContent);
    this.rte = em && em.get('RichTextEditor');
  },

  /**
   * Enable element content editing
   * @private
   * */
  enableEditing() {
    const rte = this.rte;

    if (this.rteEnabled || !this.model.get('editable')) {
      return;
    }

    if (rte) {
      try {
        this.activeRte = rte.enable(this, this.activeRte);
      } catch (err) {
        console.error(err);
      }
    }

    this.rteEnabled = 1;
    this.toggleEvents(1);
  },

  /**
   * Disable element content editing
   * @private
   * */
  disableEditing() {
    const model = this.model;
    const editable = model.get('editable');
    const rte = this.rte;

    if (rte && editable) {
      try {
        rte.disable(this, this.activeRte);
      } catch (err) {
        console.error(err);
      }

      const content = this.getChildrenContainer().innerHTML;
      const comps = model.get('components');
      comps.length && comps.reset();

      // If there is a custom RTE the content is just baked staticly
      // inside 'content'
      if (rte.customRte) {
        // Avoid double content by removing its children components
        // and force to trigger change
        model.set('content', '')
        .set('content', content);
      } else {
        const clean = model => {
          model.set({
            editable: 0,
            highlightable: 1,
            removable: 1,
            draggable: 1,
            copyable: 0,
          })
          model.get('components').each(model => clean(model));
        }

        // Avoid re-render on reset with silent option
        model.set('content', '');
        comps.add(content);
        comps.each(model => clean(model));
        comps.trigger('resetNavigator');
      }
    }

    this.rteEnabled = 0;
    this.toggleEvents();
  },

  /**
   * Isolate disable propagation method
   * @param {Event}
   * @private
   * */
  disablePropagation(e) {
    e.stopPropagation();
  },

  /**
   * Enable/Disable events
   * @param {Boolean} enable
   */
  toggleEvents(enable) {
    var method = enable ? 'on' : 'off';
    const mixins = {on, off};

    // The ownerDocument is from the frame
    var elDocs = [this.el.ownerDocument, document];
    mixins.off(elDocs, 'mousedown', this.disableEditing);
    mixins[method](elDocs, 'mousedown', this.disableEditing);

    // Avoid closing edit mode on component click
    this.$el.off('mousedown', this.disablePropagation);
    this.$el[method]('mousedown', this.disablePropagation);
  },
});
