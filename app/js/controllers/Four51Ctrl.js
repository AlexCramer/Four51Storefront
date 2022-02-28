four51.app.controller('Four51Ctrl', ['$scope', '$route', '$location', '$451', 'User', 'Order', 'Security', 'OrderConfig', 'Category', 'AppConst','XLATService', 'GoogleAnalytics',
function ($scope, $route, $location, $451, User, Order, Security, OrderConfig, Category, AppConst, XLATService, GoogleAnalytics) {
	$scope.AppConst = AppConst;
	$scope.scroll = 0;
	$scope.isAnon = $451.isAnon; //need to know this before we have access to the user object
	$scope.Four51User = Security;
	if ($451.isAnon && !Security.isAuthenticated()) {
		User.login(function () {
			$route.reload();
		});
	}

	// fix Bootstrap fixed-top and fixed-bottom from jumping around on mobile input when virtual keyboard appears
	if ($(window).width() < 960) {
		$(document)
			.on('focus', ':input:not("button")', function (e) {
				$('.navbar-fixed-bottom, .headroom.navbar-fixed-top').css("position", "relative");
			})
			.on('blur', ':input', function (e) {
				$('.navbar-fixed-bottom, .headroom.navbar-fixed-top').css("position", "fixed");
			});
	}

	function init() {
		if (Security.isAuthenticated()) {
			User.get(function (user) {
				$scope.user = user;
                $scope.user.Culture.CurrencyPrefix = XLATService.getCurrentLanguage(user.CultureUI, user.Culture.Name)[1];
                $scope.user.Culture.DateFormat = XLATService.getCurrentLanguage(user.CultureUI, user.Culture.Name)[2];

	            $scope.user.customKitProducts = {
	                "C0017-KIT":["C0017","C5055"],
	                "C0742-KIT":["C0742-Custom","C5023"],
	                "C1364-KIT":["C1364","C5024"],
	                "C3496-KIT":["C3496","C5024"],
	                "C4381-KIT":["C4381","C5022"],
	                "C4382-KIT":["C4382","C5022"],
	                "C4483-KIT":["C4483","C5022-W"],
	                "C4669-KIT":["C4669","C5023"],
	                "C4431-KIT":["C4431","C5023"],
	                "C0655-KIT":["C0655","C5023"],
	                "C5387-KIT":["C5387","C5023"],
	                "C5041-KIT":["C5041","C5023"],
	                "C5001-KIT":["C5001","C5001-A"],
	                "C5053-KIT":["C5053","C5055"],
	                "C5197-KIT":["C5197","C5055"],
	                "C5219-KIT":["C5219","C5023"],
	                "C5120-KIT":["C5120","C5032"],
	                "C5054-KIT":["C5054","C5055"],
	                "C5213-1":["C5213","C5214"],
	                "C5135-KIT":["C5135","C5136"],
	                "C5428-KIT":["C5022","C5428"],
                };
	            
	            if (!$scope.user.TermsAccepted)
		            $location.path('conditions');

				if (user.CurrentOrderID) {
					Order.get(user.CurrentOrderID, function (ordr) {
						$scope.currentOrder = ordr;
						OrderConfig.costcenter(ordr, user);
					});
				}
				else
					$scope.currentOrder = null;

				if (user.Company.GoogleAnalyticsCode) {
					GoogleAnalytics.analyticsLogin(user.Company.GoogleAnalyticsCode);
				}

			});
			Category.tree(function (data) {
				$scope.tree = data;
				$scope.$broadcast("treeComplete", data);
			});
		}
	}

	try {
		trackJs.configure({
			trackAjaxFail: false
		});
	}
	catch(ex) {}

    $scope.errorSection = '';

    function cleanup() {
        Security.clear();
    }

    $scope.$on('event:auth-loginConfirmed', function(){
        $route.reload();
	});
	$scope.$on("$routeChangeSuccess", init);
    $scope.$on('event:auth-loginRequired', cleanup);
}]);
