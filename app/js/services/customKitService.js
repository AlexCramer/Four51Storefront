four51.app.factory('CustomKit', ['Order', function(Order) {

    var specs = store.get('451Cache.CustomKitSpecs') ? store.get('451Cache.CustomKitSpecs') : {};

    function getSpecs() {
        return specs;
    }

    function setSpecs(s) {
        angular.forEach(s, function(spec) {
            if (specs[spec.Name]) {
                specs[spec.Name].Value = spec.Value;
            } else {
                specs[spec.Name] = spec;
            }
        });
        //specs = s;
        store.set('451Cache.CustomKitSpecs', specs);
    }

    var products = store.get('451Cache.CustomKitProductsConfigured') ? store.get('451Cache.CustomKitProductsConfigured') : {};

    function getProducts() {
        return products;
    }

    function setProducts(p) {
        products = p;
        store.set('451Cache.CustomKitProductsConfigured', products);
    }

    function clearProducts() {
        store.remove('451Cache.CustomKitProductsConfigured');
        products = {};
    }

    return {
        getSpecs: getSpecs,
        setSpecs: setSpecs,
        getProducts: getProducts,
        setProducts: setProducts,
        clearProducts: clearProducts
    };
}]);