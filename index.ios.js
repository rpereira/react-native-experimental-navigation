const NavigationExampleRow = require('./NavigationExampleRow');
const React = require('react');
const ReactNative = require('react-native');

const {
  Component,
  PropTypes,
} = React;

const {
  AppRegistry,
  NavigationExperimental,
  ScrollView,
  StyleSheet,
  TabBarIOS,
  Text,
  TouchableOpacity,
  View,
} = ReactNative;

const {
  CardStack: NavigationCardStack,
  Header: NavigationHeader,
  PropTypes: NavigationPropTypes,
  StateUtils: NavigationStateUtils,
} = NavigationExperimental;

// First Step.
// Define what app navigation state will look like.
function createAppNavigationState(): Object {
  return  {
    // Three tabs.
    tabs: {
      index: 0,
      routes: [
        {key: 'contacts'},
        {key: 'history'},
        {key: 'downloads'},
      ],
    },
    // Scenes for the `contacts` tab.
    contacts: {
      index: 0,
      routes: [{key: 'contacts'}],
    },
    // Scenes for the `history` tab.
    history: {
      index: 0,
      routes: [{key: 'history'}],
    },
    // Scenes for the `downloads` tab.
    downloads: {
      index: 0,
      routes: [{key: 'downloads'}],
    },
  };
}

function reducer(state: Object, action: Object): Object {
  switch (action.type) {
    case 'push': {
      // Push a route into the scenes stack.
      const route: Object = action.route;
      const {tabs} = state;
      const tabKey = tabs.routes[tabs.index].key;
      const scenes = state[tabKey];
      const nextScenes = NavigationStateUtils.push(scenes, route);
      if (scenes !== nextScenes) {
        return {
          ...state,
          [tabKey]: nextScenes,
        };
      }
      break;
    }

    case 'pop': {
      // Pops a route from the scenes stack.
      const {tabs} = state;
      const tabKey = tabs.routes[tabs.index].key;
      const scenes = state[tabKey];
      const nextScenes = NavigationStateUtils.pop(scenes);
      if (scenes !== nextScenes) {
        return {
          ...state,
          [tabKey]: nextScenes,
        };
      }
      break;
    }

    case 'switchTab': {
      // Switches the tab.
      const tabKey: string = action.tabKey;
      const tabs = NavigationStateUtils.jumpTo(state.tabs, tabKey);
      console.log('tabs after switch:', tabs);
      if (tabs !== state.tabs) {
        return {
          ...state,
          tabs
        };
      }
    }
  }
  return state;
}

// Defines a helper function that creates a HOC (higher-order-component) which
// provides a function `navigate` through component props. The `navigate`
// function will be used to invoke navigation changes.  This serves a convenient
// way for a component to navigate.
function createAppNavigationContainer(ComponentClass) {
  const key = '_AppNavigationContainerNavigateCall';

  class Container extends Component {
    static contextTypes = {
      [key]: PropTypes.func,
    };

    static childContextTypes = {
      [key]: PropTypes.func.isRequired,
    };

    static propTypes = {
      navigate: PropTypes.func,
    };

    getChildContext(): Object {
      return {
        [key]: this.context[key] || this.props.navigate,
      };
    }

    render(): React.Element {
      const navigate = this.context[key] || this.props.navigate;
      return <ComponentClass {...this.props} navigate={navigate} />;
    }
  }

  return Container;
}

/**
 * This components owns the navigation state.
 * TODO: use Redux to manage this state
 */
class YourApplication extends Component {
  // This sets up the initial navigation state.
  constructor(props, context) {
    super(props, context);
    // This sets up the initial navigation state.
    this.state = createAppNavigationState();
    this._navigate = this._navigate.bind(this);
  }

  render(): React.Element {
    // User your own navigator (see next step).
    return (
      <YourNavigator
        appNavigationState={this.state}
        navigate={this._navigate}
      />
    );
  }

  // This handles the navigation state changes.
  _navigate(action: Object): void {
    console.log('NAVIGATED:', action);
    const state = reducer(this.state, action);

    // `reducer` (which uses NavigationStateUtils) gives you
    // back the same `state` if nothing has changed. You could use
    // that to avoid redundant re-rendering.
    if (this.state !== state) {
      this.setState(state);
    }
  }
}

// controlled navigator.
const YourNavigator = createAppNavigationContainer(class extends Component {
  static propTypes = {
    appNavigationState: PropTypes.shape({
      contacts: NavigationPropTypes.navigationState.isRequired,
      history: NavigationPropTypes.navigationState.isRequired,
      downloads: NavigationPropTypes.navigationState.isRequired,
      tabs: NavigationPropTypes.navigationState.isRequired,
    }),
    navigate: PropTypes.func.isRequired,
  };

  // This sets up the methods (e.g. Pop, Push) for navigation.
  constructor(props: any, context: any) {
    super(props, context);
    this._back = this._back.bind(this);
    this._renderHeader = this._renderHeader.bind(this);
    this._renderScene = this._renderScene.bind(this);
  }

  // Now use the `NavigationCardStack` to render the scenes.
  render(): React.Element {
    const {appNavigationState} = this.props;
    const {tabs} = appNavigationState;
    const tabKey = tabs.routes[tabs.index].key;
    const scenes = appNavigationState[tabKey];

    return (
      <View style={styles.navigator}>
        <NavigationCardStack
          key={'stack_' + tabKey}
          onNavigateBack={this._back}
          navigationState={scenes}
          renderHeader={this._renderHeader}
          renderScene={this._renderScene}
          style={styles.navigatorCardStack}
        />
        <TabsView navigationState={tabs} />
      </View>
    );
  }

  // Render the header.
  // The detailed spec of `sceneProps` is defined at `NavigationTypeDefinition`
  // as type `NavigationSceneRendererProps`.
  _renderHeader(sceneProps: Object): React.Element {
    return (
      <NavBar {...sceneProps} />
    );
  }

  // Render a scene for route.
  // The detailed spec of `sceneProps` is defined at `NavigationTypeDefinition`
  // as type `NavigationSceneRendererProps`.
  _renderScene(sceneProps: Object): React.Element {
    if (sceneProps.scene.route.key === 'history') {
      return (
        <View style={styles.centeredContainer}>
          <Text >This is the history scene!</Text>
        </View>
      );
    }
    return (
      <ExampleScene {...sceneProps} />
    );
  }

  _back() {
    this.props.navigate({type: 'pop'});
  }
});

// Next step.
// Define your own header.
const NavBar = createAppNavigationContainer(class extends Component {
  static propTypes = {
    ...NavigationPropTypes.SceneRendererProps,
    navigate: PropTypes.func.isRequired,
  };

  constructor(props: Object, context: any) {
    super(props, context);
    this._back = this._back.bind(this);
    this._renderTitleComponent = this._renderTitleComponent.bind(this);
  }

  render(): React.Element {
    return (
      <NavigationHeader
        {...this.props}
        renderTitleComponent={this._renderTitleComponent}
        onNavigateBack={this._back}
      />
    );
  }

  _back(): void {
    this.props.navigate({type: 'pop'});
  }

  _renderTitleComponent(props: Object): React.Element {
    return (
      <NavigationHeader.Title>
        {props.scene.route.key}
      </NavigationHeader.Title>
    );
  }
});

// Define our scene.
// We should define one of this for each "main" scene we want to render.
const ExampleScene = createAppNavigationContainer(class extends Component {
  static propTypes = {
    ...NavigationPropTypes.SceneRendererProps,
    navigate: PropTypes.func.isRequired,
  };

  constructor(props: Object, context: any) {
    super(props, context);
    this._popRoute = this._popRoute.bind(this);
    this._pushRoute = this._pushRoute.bind(this);
  }

  render(): React.Element {
    return (
      <ScrollView>
        <NavigationExampleRow
          text="Push Route"
          onPress={this._pushRoute}
        />
        <NavigationExampleRow
          text="Pop Route"
          onPress={this._popRoute}
        />
      </ScrollView>
    );
  }

  _pushRoute(): void {
    // Just push a route with a new unique key.
    const route = {key: '[' + this.props.scenes.length + ']-' + Date.now()};
    this.props.navigate({type: 'push', route});
  }

  _popRoute(): void {
    this.props.navigate({type: 'pop'});
  }
});

const TabsView = createAppNavigationContainer(class extends Component {
  static propTypes = {
    navigationState: NavigationPropTypes.navigationState.isRequired,
    navigate: PropTypes.func.isRequired,
  };

  constructor(props: Object, context: any) {
    super(props, context);
  }

  render(): React.Element {
    return (
      <TabBarIOS
        unselectedTintColor="yellow"
        tintColor="white"
        barTintColor="darkslateblue">
        {this.props.navigationState.routes.map(this._renderTab, this)}
      </TabBarIOS>
    );
  }

  _renderTab(route: Object, index: number): React.Element {
    return (
      <TabBarItem
        key={route.key}
        route={route}
        selected={this.props.navigationState.index === index}
      />
    );
  }
});

const TabBarItem = createAppNavigationContainer(class extends Component {
  static propTypes = {
    navigate: PropTypes.func.isRequired,
    route: NavigationPropTypes.navigationRoute.isRequired,
    selected: PropTypes.bool.isRequired,
  };

  constructor(props: Object, context: any) {
    super(props, context);
    this._onPress = this._onPress.bind(this);
  }

  getIcon() {
    const routeKey = this.props.route.key;
    if (routeKey === 'contacts') {
      return 'contacts';
    }
    else if (routeKey === 'history') {
      return 'history';
    }
    else if (routeKey === 'downloads') {
      return 'downloads';
    }
  }

  render(): React.Element {
    return (
      <TabBarIOS.Item
        key={this.props.key}
        systemIcon={this.getIcon()}
        selected={this.props.selected}
        onPress={this._onPress}
      >
        {null}
      </TabBarIOS.Item>
    );
  }

  _onPress() {
    this.props.navigate({type: 'switchTab', tabKey: this.props.route.key});
  }
});

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  navigator: {
    flex: 1,
  },
  navigatorCardStack: {
    flex: 20,
  },
  tabs: {
    flex: 1,
    flexDirection: 'row',
  },
  tab: {
    alignItems: 'center',
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'center',
  },
  tabText: {
    color: '#222',
    fontWeight: '500',
  },
  tabSelected: {
    color: 'blue',
  },
});

AppRegistry.registerComponent('navigationExperiment', () => YourApplication);
