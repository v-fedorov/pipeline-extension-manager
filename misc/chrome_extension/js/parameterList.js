(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["CoveoPS"] = factory();
	else
		root["CoveoPS"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/js/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1);


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	var _this = this;
	// PS-Components
	var ParameterList_1 = __webpack_require__(2);
	exports.ParameterList = ParameterList_1.ParameterList;
	// Webpack output a library target with a temporary name.
	// This is to allow end user to put CoveoPSComponents.js before or after the main CoveoJsSearch.js, without breaking
	// This code swap the current module to the "real" Coveo variable.
	var swapVar = function () {
	    if (window['Coveo'] == undefined) {
	        window['Coveo'] = _this;
	    }
	    else {
	        _.each(_.keys(_this), function (k) {
	            window['Coveo'][k] = _this[k];
	        });
	    }
	};
	swapVar();


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var ParameterEntry_1 = __webpack_require__(3);
	var Component = Coveo.Component;
	var $$ = Coveo.$$;
	var ComponentOptions = Coveo.ComponentOptions;
	var Initialization = Coveo.Initialization;
	var ParameterList = (function (_super) {
	    __extends(ParameterList, _super);
	    function ParameterList(element, options, bindings) {
	        _super.call(this, element, ParameterList.ID, bindings);
	        this.element = element;
	        this.options = options;
	        this.options = ComponentOptions.initComponentOptions(element, ParameterList, options);
	        this.ensureDom();
	    }
	    ParameterList.prototype.createDom = function () {
	        var _this = this;
	        var button = $$('button', { className: 'btn spaced-box' }, this.options.addActionTitle);
	        button.on('click', function () { return _this.addNewParameter(); });
	        this.element.appendChild(button.el);
	    };
	    ParameterList.prototype.addNewParameter = function () {
	        var parameterOptions = {
	            parameterName: {
	                label: "Parameter Name",
	                placeholder: 'Parameter_Name'
	            },
	            parameterValue: {
	                label: "Parameter Value",
	                placeholder: 'Paramater_Value'
	            },
	            deleteAction: {
	                title: 'Remove Parameter'
	            }
	        };
	        var entryElement = $$('div').el;
	        this.element.appendChild(entryElement);
	        var entry = new ParameterEntry_1.ParameterEntry(entryElement, parameterOptions);
	        entry.build();
	    };
	    ParameterList.prototype.getParameterPayload = function () {
	        var parameterElements = this.element.querySelectorAll(".Coveo" + ParameterEntry_1.ParameterEntry.ID);
	        var parameters = {};
	        _.each(parameterElements, function (element) {
	            var parameter = Coveo.get(element);
	            parameters[parameter.getParameterName()] = parameter.getParameterValue();
	        });
	        return parameters;
	    };
	    ParameterList.ID = 'ParameterList';
	    ParameterList.options = {
	        addActionTitle: ComponentOptions.buildStringOption({ defaultValue: 'Add new parameter' })
	    };
	    return ParameterList;
	}(Component));
	exports.ParameterList = ParameterList;
	Initialization.registerAutoCreateComponent(ParameterList);


/***/ }),
/* 3 */
/***/ (function(module, exports) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var $$ = Coveo.$$;
	var Component = Coveo.Component;
	var ComponentOptions = Coveo.ComponentOptions;
	var Initialization = Coveo.Initialization;
	var DefaultParameterEntryOptions = (function () {
	    function DefaultParameterEntryOptions() {
	        this.parameterName = {
	            label: 'Paramter_Name',
	            placeholder: 'Paramater_Name'
	        };
	        this.parameterValue = {
	            label: 'Parameter_Value',
	            placeholder: 'Parameter_Value'
	        };
	        this.deleteAction = {
	            title: 'Delete this entry'
	        };
	    }
	    return DefaultParameterEntryOptions;
	}());
	exports.DefaultParameterEntryOptions = DefaultParameterEntryOptions;
	var ParameterEntry = (function (_super) {
	    __extends(ParameterEntry, _super);
	    function ParameterEntry(element, options, bindings) {
	        _super.call(this, element, ParameterEntry.ID, bindings);
	        this.element = element;
	        this.options = options;
	        this.options = ComponentOptions.initComponentOptions(element, ParameterEntry, options);
	        // this.ensureDom();
	        var defaultOptions = new DefaultParameterEntryOptions();
	        this.options = _.extend({}, defaultOptions, options);
	        this.initInputs();
	    }
	    ParameterEntry.prototype.build = function () {
	        var entry = $$('div', { className: 'row input-field multiline-field' });
	        entry.append(this.buildInput(this.parameterNameInput, this.options.parameterName.label, 'm3'));
	        entry.append(this.buildInput(this.parameterValueInput, this.options.parameterValue.label, 'm7'));
	        entry.append(this.buildDeleteIcon());
	        this.element.appendChild(entry.el);
	        this.parameterNameInput.focus();
	    };
	    ParameterEntry.prototype.buildDeleteIcon = function () {
	        var _this = this;
	        var icon = $$('div', { className: 'input-actions' });
	        var button = $$('button', { className: 'js-add-value-button' });
	        button.append($$('i', { className: 'delete-action', title: this.options.deleteAction.title }).el);
	        button.on('click', function () { return _this.destroy(); });
	        icon.append(button.el);
	        return icon.el;
	    };
	    ParameterEntry.prototype.buildInput = function (input, label, width) {
	        var parameterValue = $$('div', { className: "col " + width + " validate" });
	        var inputField = $$('div', { className: 'input-field' });
	        inputField.append(input);
	        inputField.append($$('label', { dataInvalidMessage: 'Invalid JSON' }, label).el);
	        parameterValue.append(inputField.el);
	        return parameterValue.el;
	    };
	    ParameterEntry.prototype.initInputs = function () {
	        var _this = this;
	        this.parameterNameInput = $$('input', { type: 'text', required: 'true', placeholder: this.options.parameterName.placeholder }).el;
	        this.parameterValueInput = $$('input', { type: 'text', required: 'true', placeholder: this.options.parameterValue.placeholder }).el;
	        $$(this.parameterValueInput).on('keyup', function (event, value) {
	            var text = _this.getParameterValue();
	            if (_this.couldBeJSON(text)) {
	                var isValid = _this.isValidJSON(text);
	                _this.updateInputStatus(_this.parameterValueInput, isValid);
	            }
	            else {
	                _this.updateInputStatus(_this.parameterValueInput, true);
	            }
	        });
	    };
	    ParameterEntry.prototype.getParameterName = function () {
	        return this.parameterNameInput.value;
	    };
	    ParameterEntry.prototype.getParameterValue = function () {
	        return this.parameterValueInput.value;
	    };
	    ParameterEntry.prototype.destroy = function () {
	        this.element.remove();
	    };
	    ParameterEntry.prototype.isValidJSON = function (value) {
	        try {
	            JSON.parse(value);
	        }
	        catch (error) {
	            return false;
	        }
	        return true;
	    };
	    ParameterEntry.prototype.couldBeJSON = function (value) {
	        var jsonRegex = /[\{\[\"\]\}]/;
	        return jsonRegex.test(value);
	    };
	    ParameterEntry.prototype.updateInputStatus = function (input, isValid) {
	        if (!isValid) {
	            $$(input).addClass('invalid');
	        }
	        else {
	            $$(input).removeClass('invalid');
	        }
	    };
	    ParameterEntry.ID = 'ParameterEntry';
	    return ParameterEntry;
	}(Component));
	exports.ParameterEntry = ParameterEntry;
	Initialization.registerAutoCreateComponent(ParameterEntry);


/***/ })
/******/ ])
});
;
//# sourceMappingURL=CoveoPSComponents.Custom.js.map