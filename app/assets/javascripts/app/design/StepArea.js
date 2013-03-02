// TextArea implementation which fixes focus bug in Windows FF.
// more info at: http://extjs.com/forum/showthread.php?t=19299&highlight=firefox+textfield
Ext.namespace('Ext.testia');

// This is basically just Ext.form.TextArea which inherits Ext.testia.StepField
Ext.testia.StepArea = function(config) {
    Ext.testia.StepArea.superclass.constructor.call(this,config);
};

Ext.extend(Ext.testia.StepArea, Ext.testia.StepField,  {
    /**
     * @cfg {Number} growMin The minimum height to allow when grow = true (defaults to 60)
     */
    growMin : 60,
    /**
     * @cfg {Number} growMax The maximum height to allow when grow = true (defaults to 1000)
     */
    growMax: 1000,
    growAppend : ' \n ',
    growPad : 0,
    /**
     * @cfg {Boolean} preventScrollbars True to prevent scrollbars from appearing regardless of how much text is
     * in the field (equivalent to setting overflow: hidden, defaults to false)
     */
    preventScrollbars: false,

    // private
    getPosition1: function(){
        if (document.selection) { // IE
            var r = document.selection.createRange();
            var d = r.duplicate();
            d.moveToElementText(this.el.dom);
            d.setEndPoint('EndToEnd', r);
            return d.text.length;
        }
        else {
            return this.el.dom.selectionEnd;
        }
    },

    getActiveRange: function(){
        var s = this.sep;
        var p = this.getPosition();
        var v = this.getRawValue();
        var left = p;
        while (left > 0 && v.charAt(left) != s) {
            --left;
        }
        if (left > 0) {
            left++;
        }
        return {
            left: left,
            right: p
        };
    },

    getActiveEntry: function(){
        var r = this.getActiveRange();
        return this.getRawValue().substring(r.left, r.right).replace(/^\s+|\s+$/g, '');
    },

    replaceActiveEntry: function(value){
        var r = this.getActiveRange();
        var v = this.getRawValue();
        if (this.preventDuplicates && v.indexOf(value) >= 0) {
            return;
        }
        var pad = (this.sep == ' ' ? '' : ' ');
        this.setValue(v.substring(0, r.left) + (r.left > 0 ? pad : '') + value + this.sep + pad + v.substring(r.right));
        var p = r.left + value.length + 2 + pad.length;
        this.selectText.defer(200, this, [p, p]);
    },

    onRender : function(ct, position){
        if(!this.el){
            this.defaultAutoCreate = {
                tag: "textarea",
                style:"width:300px;height:60px;",
                autocomplete: "off"
            };
        }
        Ext.testia.StepArea.superclass.onRender.call(this, ct, position);

        if(this.grow){
            this.textSizeEl = Ext.DomHelper.append(document.body, {
                tag: "pre", cls: "x-form-grow-sizer"
            });
            if(this.preventScrollbars){
                this.el.setStyle("overflow", "hidden");
            }
            this.el.setHeight(this.growMin);
        }
    },

    onSelect: function(record, index){
        if (this.fireEvent('beforeselect', this, record, index) !== false) {
            var value = record.data[this.valueField || this.displayField];
            if (this.sep) {
                this.replaceActiveEntry(value);
            }
            else {
                this.setValue(value);
            }
            this.collapse();
            this.fireEvent('select', this, record, index);
        }
    },

    initQuery: function(){
        this.doQuery(this.sep ? this.getActiveEntry() : this.getRawValue());
    },


    onDestroy : function(){
        if(this.textSizeEl){
            this.textSizeEl.parentNode.removeChild(this.textSizeEl);
        }
        Ext.testia.StepArea.superclass.onDestroy.call(this);
    },

    // private
    onKeyUp : function(e){
        if(!e.isNavKeyPress() || e.getKey() == e.ENTER){
            this.autoSize();
        }
    },

    /**
     * Automatically grows the field to accomodate the height of the text up to the maximum field height allowed.
     * This only takes effect if grow = true, and fires the autosize event if the height changes.
     */
    autoSize : function(){
        if(!this.grow || !this.textSizeEl){
            return;
        }
        var el = this.el;
        var v = el.dom.value;
        var ts = this.textSizeEl;
        var vs; // max view size

        ts.innerHTML = '';
        ts.appendChild(document.createTextNode(v));
        v = ts.innerHTML;

        Ext.fly(ts).setWidth(this.el.getWidth());
        if(v.length < 1){
            v = "&#160;&#160;";
        }else{
            if(Ext.isIE){
                v = v.replace(/\n/g, '<p>&#160;</p>');
            }
            v += "&#160;\n&#160;";
        }
        ts.innerHTML = v;
        if (Ext.isIE) {
            // Fix these calculations for IE
            vs = this.growMax;
        } else {
            vs = window.innerHeight - el.getY();
        }

        var h = Math.min(this.growMax, vs, Math.max(ts.offsetHeight, this.growMin));
        if(h != this.lastHeight){
            this.lastHeight = h;
            this.el.setHeight(h);
            this.fireEvent("autosize", this, h);
        }
    }
});