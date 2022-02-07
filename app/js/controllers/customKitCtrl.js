four51.app.controller('CustomKitCtrl', ['$scope', '$routeParams', '$route', '$location', '$451', 'Product', 'ProductDisplayService', 'Order', 'Variant', 'User', 'CustomKit', 'LocationService',
function ($scope, $routeParams, $route, $location, $451, Product, ProductDisplayService, Order, Variant, User, CustomKit, LocationService) {
    $scope.selected = 1;
    $scope.LineItem = {};
    $scope.addToOrderText = "Add To Cart";
    $scope.loadingIndicator = true;
    $scope.loadingImage = true;
    $scope.searchTerm = null;
    $scope.settings = {
        currentPage: 1,
        pageSize: 10
    };

    var varID = $routeParams.variantInteropID == 'new' ? null :  $routeParams.variantInteropID;
    $scope.kitID = $routeParams.kitID;

    $scope.calcVariantLineItems = function(i){
        $scope.variantLineItemsOrderTotal = 0;
        angular.forEach($scope.variantLineItems, function(item){
            $scope.variantLineItemsOrderTotal += item.LineTotal || 0;
        })
    };
    function setDefaultQty(lineitem) {
        if (lineitem.PriceSchedule && lineitem.PriceSchedule.DefaultQuantity != 0)
            $scope.LineItem.Quantity = lineitem.PriceSchedule.DefaultQuantity;
    }
    function init(searchTerm, callback) {
        $scope.locationOptions = LocationService.locationOptions;
        ProductDisplayService.getProductAndVariant($routeParams.productInteropID, varID, function (data) {
            $scope.LineItem.Product = data.product;
            if (varID) {
                $scope.LineItem.Variant = data.variant;
            }
            ProductDisplayService.setNewLineItemScope($scope);
            ProductDisplayService.setProductViewScope($scope);
            setDefaultQty($scope.LineItem);
            $scope.$broadcast('ProductGetComplete');
            $scope.loadingIndicator = false;
            $scope.setAddToOrderErrors();
            if (angular.isFunction(callback))
                callback();
        }, $scope.settings.currentPage, $scope.settings.pageSize, searchTerm);
    }
    $scope.$watch('settings.currentPage', function(n, o) {
        if (n != o || (n == 1 && o == 1))
            init($scope.searchTerm);
    });

    $scope.searchVariants = function(searchTerm) {
        $scope.searchTerm = searchTerm;
        $scope.settings.currentPage == 1 ?
            init(searchTerm) :
            $scope.settings.currentPage = 1;
    };

    $scope.deleteVariant = function(v, redirect) {
        if (!v.IsMpowerVariant) return;
        // doing this because at times the variant is a large amount of data and not necessary to send all that.
        var d = {
            "ProductInteropID": $scope.LineItem.Product.InteropID,
            "InteropID": v.InteropID
        };
        Variant.delete(d,
            function() {
                redirect ? $location.path('/customKit/' + $scope.kitID + '/' + $scope.LineItem.Product.InteropID) : $route.reload();
            },
            function(ex) {
                $scope.lineItemErrors.push(ex.Message);
                $scope.showAddToCartErrors = true;
            }
        );
    };

    $scope.addToOrder = function(){
        if($scope.lineItemErrors && $scope.lineItemErrors.length){
            $scope.showAddToCartErrors = true;
            return;
        }

        $scope.addToOrderIndicator = true;

        if(!$scope.currentOrder){
            $scope.currentOrder = { };
            $scope.currentOrder.LineItems = [];
        }
        if (!$scope.currentOrder.LineItems) {
            $scope.currentOrder.LineItems = [];
        }

        var products = CustomKit.getProducts();
        products[$scope.LineItem.Product.InteropID] = 'added';
        CustomKit.setProducts(products);
        if($scope.allowAddFromVariantList) {
            angular.forEach($scope.variantLineItems, function (item) {
                if (item.Quantity > 0) {
                    $scope.currentOrder.LineItems.push(item);
                }
            });
        }
        else {
            $scope.currentOrder.LineItems.push($scope.LineItem);
        }

        Order.clearshipping($scope.currentOrder).
            save($scope.currentOrder,
            function(o){
                $scope.user.CurrentOrderID = o.ID;
                User.save($scope.user, function(){
                    $scope.addToOrderIndicator = false;
                    nextProduct();
                    //$location.path('/cart' + ($scope.isEditforApproval ? '/' + o.ID : ''));
                });
            },
            function(ex) {
                $scope.addToOrderIndicator = false;
                $scope.lineItemErrors.push(ex.Detail);
                $scope.showAddToCartErrors = true;
            }
        );
    };

    $scope.setOrderType = function(type) {
        $scope.loadingIndicator = true;
        $scope.currentOrder = { 'Type': type };
        init(null, function() {
            $scope.loadingIndicator = false;
        });
    };

    $scope.$on('event:imageLoaded', function(event, result) {
        $scope.loadingImage = false;
        $scope.$apply();
    });

    $scope.variantErrors = [];

    $scope.loadingImage = true;
    ProductDisplayService.getProductAndVariant($routeParams.productInteropID, varID, function(data){
        $scope.Product = data.product;
        if(varID)
            $scope.Variant = data.variant;
        else{
            $scope.Variant = {};
            $scope.Variant.ProductInteropID = $scope.Product.InteropID;
            $scope.Variant.Specs = {};
            var CustomKitSpecs = CustomKit.getSpecs();
            angular.forEach($scope.Product.Specs, function(item){
                if(!item.CanSetForLineItem)
                {
                    $scope.Variant.Specs[item.Name] = item;
                    if (CustomKitSpecs[item.Name]) {
                        $scope.Variant.Specs[item.Name].Value = CustomKitSpecs[item.Name].Value;
                        console.log(item.Name + ' : ' + CustomKitSpecs[item.Name].Value);
                    }
                }
            });
        }
    });

    function validateVariant(){
        if(!$scope.Variant) return;
        var newErrors = [];
        angular.forEach($scope.Variant.Specs, function(s){
            if(s.Required && !s.Value)
                newErrors.push(s.Label || s.Name + ' is a required field');
        });
        $scope.variantErrors = newErrors;
    }

    $scope.$watch('Variant.Specs', function(o, n){
        validateVariant();
    }, true);

    function saveVariant(variant, saveNew, hideErrorAlert /*for compatibility*/) {
        if($scope.variantErrors.length){
            $scope.showVariantErrors = true;
            if(!hideErrorAlert)
                $window.alert("please fill in all required fields"); //the default spec form should be made to deal with showing $scope.variantErrors, but it's likely existing spec forms may not deal with $scope.variantErrors
            return;
        }
        if(saveNew) $scope.Variant.InteropID = null;
        Variant.save(variant, function(data){
            CustomKit.setSpecs(data.Specs);
            $location.path('/customKit/' + $scope.kitID + '/' + $scope.Product.InteropID + '/'+ data.InteropID);
        });
    }
    
    $scope.save = function(hideErrorWindowAlert){
        saveVariant($scope.Variant, false, hideErrorWindowAlert);
    };

    $scope.saveasnew = function(hideErrorAlert) {
        saveVariant($scope.Variant, true, hideErrorAlert);
    };

    /* Corporate ID Specific Functionality */

    $scope.skipProduct = function(productID) {
        var products = CustomKit.getProducts();
        products[productID] = 'skipped';
        CustomKit.setProducts(products);

        var nextProduct = null;
        angular.forEach($scope.user.customKitProducts[$scope.kitID], function(p) {
            if (!products[p] && !nextProduct) {
                nextProduct = p;
            }
        });

        if (nextProduct) {
            $location.path('/customKit/' + $scope.kitID + '/' + nextProduct);
        }
        else {
            nextPath();
        }
    };

    function addNextProduct(product, qty){
        ProductDisplayService.getProductAndVariant(product, null, function(data){
            $scope.LineItem = {};
            $scope.LineItem.Product = data.product;
            $scope.LineItem.Quantity = qty;
            if($scope.LineItem.Product.Type != "Static"){
                $scope.LineItem.Variant = {};
                $scope.LineItem.Variant.InteropID = null;
                $scope.LineItem.Variant.ProductInteropID = $scope.LineItem.Product.InteropID;
                $scope.LineItem.Variant.Specs = {};
                var CustomKitSpecs = CustomKit.getSpecs();
                angular.forEach($scope.LineItem.Product.Specs, function(item){
                    if(!item.CanSetForLineItem)
                    {
                        $scope.LineItem.Variant.Specs[item.Name] = item;
                        if (CustomKitSpecs[item.Name]) {
                            $scope.LineItem.Variant.Specs[item.Name].Value = CustomKitSpecs[item.Name].Value;
                            console.log(item.Name + ' : ' + CustomKitSpecs[item.Name].Value);
                        }
                    }
                });
                Variant.save($scope.LineItem.Variant, function(data){
                    $scope.LineItem.Variant = data;
                    $scope.addToOrder();
                });
            }
            else{
                $scope.addToOrder();
            }
        });
    }

    function nextProduct() {
        var products = CustomKit.getProducts();
        var nextProduct = null;
        angular.forEach($scope.user.customKitProducts[$scope.kitID], function(p) {
            if (!products[p] && !nextProduct) {
                nextProduct = p;
            }
        });

        if (nextProduct) {
            var qty = angular.copy($scope.LineItem.Quantity);
            addNextProduct(nextProduct,qty);
        }
        else {
            nextPath();
        }
    }

    function nextPath() {
        if ($scope.currentOrder && $scope.currentOrder.LineItems && $scope.currentOrder.LineItems.length > 0) {
            CustomKit.clearProducts();
            $location.path('cart');
        }
        else {
            $location.path('catalog');
        }
    }

}]);
