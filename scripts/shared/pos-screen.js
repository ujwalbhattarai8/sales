﻿var pageLoaded = false;

$(document).off("itemAdded").on("itemAdded", function (e, tabId, itemId) {
    const model = window.getModelById(tabId);
    if (!model) {
        return;
    };

    const item = window.Enumerable.From(model.Details).Where(function (x) { return x.ItemId.toString() === itemId.toString(); }).FirstOrDefault();


    if (!item) {
        return;
    };

    const el = $("#pos-" + itemId);
    const unitSelect = el.find("select.unit");

    if (unitSelect.length) {
        unitSelect.val(item.UnitId);
    };

    const quantityInput = el.find("input.quantity");

    if (quantityInput.length) {
        quantityInput.val(item.Quantity);
    };

    const priceInput = el.find("input.price");

    if (priceInput.length) {
        priceInput.val(item.Price);
    };

    const discountInput = el.find("input.discount");

    if (discountInput.length) {
        discountInput.val(item.DiscountRate);
    };

    discountInput.trigger("keyup");
});

$("#SalesItems .item").on("contextmenu", function (e) {
    e.preventDefault();
    const el = $(this);
    const defaultMenu = el.find(".info.block, .number.block");
    const contextMenu = el.find(".context.menu");

    defaultMenu.toggle();
    contextMenu.toggle();
});

setTimeout(function () {
    window.fetchProducts();
}, 120000);

function removeItem(el) {
    const confirmed = confirm(window.translate("AreYouSure"));

    if (!confirmed) {
        return;
    };

    el = $(el);
    const container = el.parent().parent();
    container.remove();
    window.updateTotal();
};


$(".toggle.view.item, .next.button").off("click").on("click", function () {
    const salesItemState = $(".sales.items").is(":visible");

    $(".tender.info.items").hide();
    $(".footer.items").hide();
    $(".sales.items").hide();

    if (salesItemState) {
        $(".tender.info.items").show();
    } else {
        $(".footer.items").show();
        $(".sales.items").show();
    };
});


$("#ReceiptSummary div.tender .money input").keyup(function () {
    window.updateTotal();
});

$("#DiscountTypeSelect").change(function () {
    window.updateTotal();
});

$("#DiscountInputText").keyup(function () {
    const rate = parseFloat($("#DiscountInputText").val()) || 0;
    const type = window.parseInt($("#DiscountTypeSelect").val()) || 0;

    if (type === 1 && rate > 100) {
        $("#DiscountInputText").val("0");
    };

    window.updateTotal();
    window.updateTenderInfo();
});

function updateTotal() {
    const candidates = $("#SalesItems div.item");
    const amountEl = $("div.amount .money");
    const countEl = $("div.count .money");
    const couponDiscountType = parseInt($("#DiscountTypeSelect").val());
    const couponDiscountRate = parseFloat($("#DiscountInputText").val()) || 0;
    var discount;


    var totalPrice = 0;
    var totalQuantity = 0;

    $.each(candidates, function () {
        const el = $(this);
        const quantityEl = el.find("input.quantity");
        const quantity = parseFloat(quantityEl.val()) || 0;

        const discountedAmount = window.parseFloat2(el.find(".discounted.amount").html());
        const amountPlusTax = window.parseFloat2(el.find(".amount-plus-tax").html());
        const lineTotal = (amountPlusTax || discountedAmount);
        totalPrice += lineTotal;

        totalQuantity += quantity;
    });

    totalPrice = parseFloat(window.round(totalPrice, 2)) || 0;

    if (couponDiscountType === 1 && couponDiscountRate > 0 && couponDiscountRate <= 100) {
        discount = totalPrice * (couponDiscountRate / 100);
        totalPrice = totalPrice - discount;
    } else if (couponDiscountType === 2 && couponDiscountRate > 0) {
        //Discount amount
        totalPrice = totalPrice - couponDiscountRate;
    };


    amountEl.html(window.getFormattedNumber(window.round(totalPrice, 2)));
    countEl.html(window.getFormattedNumber(window.round(totalQuantity, 2)));
};



$("#ClearScreenButton").off("click").on("click", function () {
    clearScreen();
});

function clearScreen() {
    $("#SalesItems").html("");
    $("#CustomerInputText").removeAttr("data-customer-id").val("");
    $("#TenderInputText").val("");
    $("#ChangeInputText").val("");

    window.updateTotal();
};

function loadStores() {
    window.displayFieldBinder($("#StoreSelect"), "/api/forms/inventory/stores/display-fields", true);
};

function loadPaymentTerms() {
    window.displayFieldBinder($("#PaymentTermSelect"), "/api/forms/sales/payment-terms/display-fields", false);
};

function loadShippers() {
    window.displayFieldBinder($("#ShipperSelect"), "/api/forms/inventory/shippers/display-fields", true);
};

function loadCostCenters() {
    window.displayFieldBinder($("#CostCenterSelect"), "/api/forms/finance/cost-centers/display-fields", true);
};

function loadPriceTypes() {
    window.displayFieldBinder($("#PriceTypeSelect"), "/api/forms/sales/price-types/display-fields", true);
};


loadStores();
loadPriceTypes();

loadCostCenters();
loadShippers();
loadPaymentTerms();

$('.ui.customer.search').search({
    apiSettings: {
        url: '/dashboard/sales/setup/customer/search/{query}'
    },
    fields: {
        results: 'Items',
        title: 'CustomerCode',
        description: 'CustomerName',
        image: 'Photo',
        price: 'PhoneNumbers'
    },
    onSelect: function (result) {
        const customerId = result.CustomerId;
        if (!customerId) {
            return;
        };

        $("#CustomerInputText").attr("data-customer-id", customerId);
    },
    minCharacters: 1
});

$("#StoreSelect").off("change").on("change", function () {
    var el = $(this);

    function loadCounters() {
        const storeId = el.val();

        if (!storeId) {
            return;
        };

        const filters = [];
        filters.push(window.getAjaxColumnFilter("WHERE", "StoreId", "int", window.FilterConditions.IsEqualTo, storeId));

        window.displayFieldBinder($("#CounterSelect"), "/api/forms/inventory/counters/display-fields/get-where", true, filters, function () {
            const counterId = el.attr("data-counter-id");

            el.removeAttr("data-counter-id");

            if (!counterId) {
                return;
            };

            $("#CounterSelect").val(counterId);
        });
    };

    loadCounters();
});

function initializeTabs() {
    $(".pos.tabs .item:not(.new)").off("click").on("click", function () {
        window.saveState();
        $(".pos.tabs .item").removeClass("selected");
        const el = $(this);
        el.addClass("selected");
        window.loadState();
    });
};

$(".tabs .new.item").off("click").on("click", function () {
    var el = $(this);
    window.saveState();

    function createTab(id) {
        const item = $("<div class='item' />");
        item.attr("id", "tab-item-" + id);
        item.html(id);

        el.siblings(".actions").before(item);
    };

    var items = [];
    const candidates = $(".tabs .item:not(.new)");

    $.each(candidates, function () {
        const el = $(this);
        const id = parseInt(el.text());
        items.push(id);
    });

    const max = window.Enumerable.From(items).Max(function (x) { return x; });
    var nextValue = 1;

    if (max) {
        nextValue = max + 1;
    };

    createTab(nextValue);


    initializeTabs();
    $(".tabs .item").removeClass("selected");
    $("#tab-item-" + nextValue).addClass("selected");
    clearScreen();
});

$(".tabs .actions .delete.icon").off("click").on("click", function () {
    const activeEl = $(".tabs .selected.item");
    const id = parseInt(activeEl.text());

    if (activeEl.length && id > 1) {
        const confirmed = window.confirm(window.translate("AreYouSureYouWantDeleteTab"));

        if (!confirmed) {
            return;
        };

        window.removeState();

        const previousEl = activeEl.prev(".item");
        previousEl.addClass("selected");
        activeEl.remove();
        window.loadState();
    };
});

initializeTabs();

$(".toolbar .item[data-payment-type]").off("click").on("click", function () {
    const el = $(this);
    const paymentType = el.attr("data-payment-type");
    $(".payment.type.container [data-payment-type]").hide();
    $(".payment.type.container [data-payment-type=" + paymentType + "]").show();
});

$(".show.more.anchor").off("click").on("click", function () {
    const more = $(".tender.info.items .more");

    more.show();
    $(this).hide();
});

$(".show.less.anchor").off("click").on("click", function () {
    const more = $(".tender.info.items .more");

    more.hide();
    $(".show.more.anchor").show();
});

$(document).ajaxStop(function () {
    if (!pageLoaded) {
        $("#pos-container .dimmer").hide();
        $("#pos-container .layout").fadeIn(500);
    };

    if (!pageLoaded) {
        $(document).trigger("posready");
    };

    pageLoaded = true;
});


setTimeout(function () {
    $(".decimal").number(true, window.currencyDecimalPlaces, ".", "");
}, 100);


window.overridePath = "/dashboard/sales/tasks/entry";

$("#GiftCardNumberInputText").on("change", function () {
    function request(giftCardNumber) {
        var url = "/dashboard/loyalty/tasks/gift-cards/get-balance/{giftCardNumber}";
        url = url.replace("{giftCardNumber}", giftCardNumber);

        return window.getAjaxRequest(url, "POST");
    };

    const el = $(this);
    const giftCardNumber = el.val();

    if (!giftCardNumber) {
        return;
    };

    const ajax = request(giftCardNumber);

    ajax.success(function (response) {
        $("#GiftCardNumberBalanceInputText").val(response);
    });
});

function getTaxRate() {
    function request() {
        const url = "/api/forms/finance/tax-setups/get-where/-1";
        const filters = [];
        filters.push(window.getAjaxColumnFilter("WHERE", "OfficeId", "int", window.FilterConditions.IsEqualTo,
            window.metaView.OfficeId));

        return window.getAjaxRequest(url, "POST", filters);
    };

    const ajax = request();

    ajax.success(function (response) {
        const salesTaxRate = parseFloat(response[0].SalesTaxRate) || 0;
        $("#SalesTaxRateHidden").val(salesTaxRate);
    });
};

if (window.metaView) {
    getTaxRate();
} else {
    $(document).on("metaready", function () {
        getTaxRate();
    });
};