import tweenState from 'react-tween-state';
import NativeButton from './NativeButton';
import styles from './styles';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';

import { PanResponder, TouchableHighlight, StyleSheet, Text, View, ViewPropTypes } from 'react-native';

//--------------------------------------------------
//  SwipeoutBtn Class
//--------------------------------------------------

const SwipeoutBtn = createReactClass({

  //--------------------------------------------------
  //  Props
  //--------------------------------------------------

  // Prop Types
  propTypes: {
    text: PropTypes.node,
    color: PropTypes.string,
    onPress: PropTypes.func,
    component: PropTypes.node,
    underlayColor: PropTypes.string,
    backgroundColor: PropTypes.string
  },

  // Default Props
  getDefaultProps: function() {
    return {
      width: 0,
      height: 0,
      color: null,
      text: 'Btn',
      onPress: null,
      disabled: false,
      component: null,
      underlayColor: null,
      backgroundColor: null,
    };
  },

  //--------------------------------------------------
  //  Render
  //--------------------------------------------------

  // Render Button
  render: function() {

    // Passed Styling
    var btn = this.props;
    // Button Styling
    var styleSwipeoutBtn = [styles.swipeoutBtn];
    var styleSwipeoutBtnText = [styles.swipeoutBtnText];
    var styleSwipeoutBtnComponent = [];

    // Apply Background Color
    if (btn.backgroundColor) {
      styleSwipeoutBtn.push({ backgroundColor: btn.backgroundColor })
    }

    // Apply Button Size
    styleSwipeoutBtn.push({
      height: btn.height,
      width: btn.width
    });

    // Apply Button Component Size
    styleSwipeoutBtnComponent.push({
      height: btn.height,
      width: btn.width
    })

    // Apply Text Color
    if (btn.color) {
      styleSwipeoutBtnText.push({ color: btn.color});
    }

    // Return Button
    return (
      <NativeButton
        onPress={this.props.onPress}
        underlayColor={this.props.underlayColor}
        disabled={this.props.diabled}
        style={styleSwipeoutBtn}
        textStyle={styleSwipeoutBtnText}
      >
        {btn.component ? <View style={styleSwipeoutBtnComponent}>{btn.component}</View> : btn.text}
      </NativeButton>
    );
  }
});

//--------------------------------------------------
//  Swipeout Class
//--------------------------------------------------

const Swipeout = createReactClass({

  // TweenState Mixins
  mixins: [tweenState.Mixin],

  //--------------------------------------------------
  //  Props
  //--------------------------------------------------

  // Prop Types
  propTypes: {
    close: PropTypes.bool,
    left: PropTypes.array,
    right: PropTypes.array,
    scroll: PropTypes.func,
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
    disabled: PropTypes.bool,
    autoClose: PropTypes.bool,
    sensitivity: PropTypes.number,
    buttonWidth: PropTypes.number,
    backgroundColor: PropTypes.string,
    style: (ViewPropTypes || View.propTypes).style,
  },

  // Default Props
  getDefaultProps: function() {
    return {
      rowID: -1,
      sectionID: -1,
      disabled: false,
      sensitivity: 50,
    };
  },

  // Initial Prop State
  getInitialState: function() {
    return {
      btnWidth: 0,
      btnsLeftWidth: 0,
      btnsRightWidth: 0,
      contentPos: 0,
      contentWidth: 0,
      contentHeight: 0,
      swiping: false,
      timeStart: null,
      tweenDuration: 160,
      openedLeft: false,
      openedRight: false,
      autoClose: this.props.autoClose || false,
    };
  },

  componentWillReceiveProps: function(nextProps) {
    if (nextProps.close) {
      this._close(null, false);
    }
  },

  //--------------------------------------------------
  //  Mounting
  //--------------------------------------------------

  componentWillMount: function() {
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (event, gestureState) => {
        return true;
      },
      onStartShouldSetPanResponderCapture: (event, gestureState) => {
        return this.state.openedLeft || this.state.openedRight;
      },
      onMoveShouldSetPanResponderCapture: (event, gestureState) => {
        return Math.abs(gestureState.dx) > this.props.sensitivity && Math.abs(gestureState.dy) <= this.props.sensitivity;
      },
      onShouldBlockNativeResponder: (event, gestureState) => {
        return false;
      },
      onPanResponderTerminationRequest: () => {
        return false;
      },
      onPanResponderGrant: this._handlePanResponderGrant,
      onPanResponderMove: this._handlePanResponderMove,
      onPanResponderRelease: this._handlePanResponderEnd,
      onPanResponderTerminate: this._handlePanResponderEnd,
    });
  },

  //--------------------------------------------------
  //  Handle Pan Responser
  //--------------------------------------------------

  _handlePanResponderGrant: function(e: Object, gestureState: Object) {
    // If the swipeout is disabled, do nothing.
    if (this.props.disabled) {
      return;
    }

    this.refs.swipeoutContent.measure((ox, oy, width, height) => {
      let buttonWidth = this.props.buttonWidth || (width/5);
      this.setState({
        swiping: true,                      // Helps determine if the user is performing a swipe
        timeStart: (new Date()).getTime(),  // Helps determine a quick swipe.
        btnWidth: buttonWidth,              // The width of the button we might display.
        btnsLeftWidth: this.props.left ? buttonWidth * this.props.left.length : 0,
        btnsRightWidth: this.props.right ? buttonWidth * this.props.right.length : 0,
      });
    });
  },

  _handlePanResponderMove: function(e: Object, gestureState: Object) {

    this._onSwipe();

    // If the swipeout is disabled, do nothing.
    if (this.props.disabled) {
      return;
    }

    var posX = gestureState.dx;
    var posY = gestureState.dy;
    var leftWidth = this.state.btnsLeftWidth;
    var rightWidth = this.state.btnsRightWidth;

    // Compensate for an open swipeout.
    if (this.state.openedRight) {
      var posX = gestureState.dx - rightWidth;
    }
    else if (this.state.openedLeft) {
      var posX = gestureState.dx + leftWidth;
    }

    // Attempt to notify if scrolling should be disabled.
    if (this.props.scroll) {
      if (Math.abs(posX) > Math.abs(posY)) {
        this.props.scroll(false);
      }
      else {
        this.props.scroll(true);
      }
    }

    // If we are swiping to reveal hidden view.
    if (this.state.swiping) {
      // Move content to reveal swipeout in the correct direction.
      if (posX < 0 && this.props.right) {
        this.setState({ contentPos: Math.min(posX, 0) })
      }
      else if (posX > 0 && this.props.left) {
        this.setState({ contentPos: Math.max(posX, 0) })
      };
    }
  },

  _handlePanResponderEnd: function(e: Object, gestureState: Object) {
    // If the swipeout is disabled, do nothing.
    if (this.props.disabled) {
      return;
    }

    var posX = gestureState.dx;
    var contentPos = this.state.contentPos;
    var contentWidth = this.state.contentWidth;
    var btnsLeftWidth = this.state.btnsLeftWidth;
    var btnsRightWidth = this.state.btnsRightWidth;

    // Minimum threshold to open swipeout
    var openX = contentWidth * 0.33;

    // Should open swipeout
    var openLeft = posX > openX || posX > btnsLeftWidth / 2;
    var openRight = posX < -openX || posX < -btnsRightWidth / 2;

    // Account for open swipeouts
    if (this.state.openedRight) {
      var openRight = posX-openX < -openX;
    }
    if (this.state.openedLeft) {
      var openLeft = posX+openX > openX;
    }

    // Reveal swipeout on quick swipe gesture.
    var timeDiff = (new Date()).getTime() - this.state.timeStart < 200;
    if (timeDiff) {
      var openRight = posX < -openX / 10 && !this.state.openedLeft;
      var openLeft = posX > openX / 10 && !this.state.openedRight;
    }

    // If we are swiping
    if (this.state.swiping) {
      if (openRight && contentPos < 0 && posX < 0) {
        this._open(-btnsRightWidth, 'right');
      }
      else if (openLeft && contentPos > 0 && posX > 0) {
        this._open(btnsLeftWidth, 'left');
      }
      else {
        this._close(this.state.openedLeft ? 'left' : 'right', true);
      }
    }

    // Notify that its okay to scroll vertically again.
    if (this.props.scroll) {
      this.props.scroll(true);
    }
  },

  //--------------------------------------------------
  //  Animation Manipulation
  //--------------------------------------------------

  _tweenContent: function(state, endValue) {
    this.tweenState(state, {
      easing: tweenState.easingTypes.easeInOutQuad,
      duration: endValue === 0 ? this.state.tweenDuration * 1.5 : this.state.tweenDuration,
      endValue: endValue,
    });
  },

  _rubberBandEasing: function(value, limit) {
    if (value < 0 && value < limit) {
      return limit - Math.pow(limit - value, 0.85);
    }
    else if (value > 0 && value > limit) {
      return limit + Math.pow(value - limit, 0.85);
    }
    return value;
  },

  //--------------------------------------------------
  //  Triggers
  //--------------------------------------------------

  // Calls the onSwipe prop if it exists.
  _onSwipe: function() {
    if (this.props.onSwipe) {
      this.props.onSwipe(this.props.sectionID, this.props.rowID);
    }
  },

  // Calls the onClose prop if it exists.
  // - side is the side that was closed.
  _callOnClose: function(side) {
    if (this.props.onClose) {
      this.props.onClose(this.props.sectionID, this.props.rowID, side);
    }
  },

  // Calls the onOpen prop if it exists.
  //  - side is the side that was opened.
  _callOnOpen: function(side) {
    if (this.props.onOpen) {
      this.props.onOpen(this.props.sectionID, this.props.rowID, side);
    }
  },

  //--------------------------------------------------
  //  Actions
  //--------------------------------------------------

  // Close swipeout on button press.
  // - btn is the button that was pressed.
  _autoClose: function(btn) {
    if (this.state.autoClose) {
      this._close(this.state.openedLeft ? 'left' : 'right', true);
    }
    if (btn.onPress) {
      onPress();
    }
  },

  // Opens a row.
  // - contentPos is the button's location.
  // - direction is the side that was opened.
  _open: function(contentPos, side) {
    const left = side === 'left';
    this._callOnOpen(side);
    // Set the row to open
    this._tweenContent('contentPos', contentPos);
    this.setState({
      contentPos,
      openedLeft: left,
      openedRight: !left,
      swiping: false,
    });
  },

  // Closes a row.
  _close: function(side, trigger) {
    // If it was already open, we call on close. (As we are visibly closing it)
    if (trigger && (this.state.openedLeft || this.state.openedRight)) {
      this._callOnClose(side);
    }
    // Set the row to closed.
    this._tweenContent('contentPos', 0);
    this.setState({
      openedRight: false,
      openedLeft: false,
      swiping: false,
    });
  },

  // _openRight: function() {
  //   this.refs.swipeoutContent.measure((ox, oy, width, height) => {
  //     this.setState({
  //       btnWidth: (width/5),
  //       btnsRightWidth: this.props.right ? (width/5)*this.props.right.length : 0,
  //     }, () => {
  //       this._tweenContent('contentPos', -this.state.btnsRightWidth);
  //       //this._callOnOpen();
  //       this.setState({
  //         contentPos: -this.state.btnsRightWidth,
  //         openedLeft: false,
  //         openedRight: true,
  //         swiping: false
  //       });
  //     });
  //   });
  // },

  // _openLeft: function() {
  //   this.refs.swipeoutContent.measure((ox, oy, width, height) => {
  //     this.setState({
  //       btnWidth: (width/5),
  //       btnsLeftWidth: this.props.left ? (width/5)*this.props.left.length : 0,
  //     }, () => {
  //       this._tweenContent('contentPos', this.state.btnsLeftWidth);
  //       //this._callOnOpen();
  //       this.setState({
  //         contentPos: this.state.btnsLeftWidth,
  //         openedLeft: true,
  //         openedRight: false,
  //         swiping: false
  //       });
  //     });
  //   });
  // },

  //--------------------------------------------------
  //  Render
  //--------------------------------------------------

  render: function() {
    var contentWidth = this.state.contentWidth;
    var posX = this.getTweeningValue('contentPos');

    var styleSwipeout = [styles.swipeout, this.props.style];
    if (this.props.backgroundColor) {
      styleSwipeout.push([{ backgroundColor: this.props.backgroundColor }]);
    }

    var limit = -this.state.btnsRightWidth;
    if (posX > 0) {
      limit = this.state.btnsLeftWidth;
    }

    var styleLeftPos = {
      left: {
        left: 0,
        overflow: 'hidden',
        width: Math.min(limit*(posX/limit), limit),
      },
    };

    var styleRightPos = {
      right: {
        left: Math.abs(contentWidth + Math.max(limit, posX)),
        right: 0,
      },
    };

    var styleContentPos = {
      content: {
        left: this._rubberBandEasing(posX, limit),
      },
    };

    var styleContent = [styles.swipeoutContent];
    styleContent.push(styleContentPos.content);

    var styleRight = [styles.swipeoutBtns];
    styleRight.push(styleRightPos.right);

    var styleLeft = [styles.swipeoutBtns];
    styleLeft.push(styleLeftPos.left);

    var isRightVisible = posX < 0;
    var isLeftVisible = posX > 0;

    return (
      <View style={styleSwipeout}>
        <View
          ref="swipeoutContent"
          style={styleContent}
          onLayout={this._onLayout}
          {...this._panResponder.panHandlers}
        >
          {this.props.children}
        </View>
        { this._renderButtons(this.props.right, isRightVisible, styleRight) }
        { this._renderButtons(this.props.left, isLeftVisible, styleLeft) }
      </View>
    );
  },

  _onLayout: function(event) {
    var { width, height } = event.nativeEvent.layout;
    this.setState({
      contentWidth: width,
      contentHeight: height,
    });
  },

  _renderButtons: function(buttons, isVisible, style) {
    if (buttons && isVisible) {
      return(
      <View style={style}>
        { buttons.map(this._renderButton) }
      </View>);
    }
    else {
      return (
        <View/>
      );
    }
  },

  _renderButton: function(btn, i) {
    return (
      <SwipeoutBtn
        backgroundColor={btn.backgroundColor}
        color={btn.color}
        component={btn.component}
        disabled={btn.disabled}
        height={this.state.contentHeight}
        key={i}
        onPress={() => this._autoClose(btn)}
        text={btn.text}
        underlayColor={btn.underlayColor}
        width={this.state.btnWidth}
      />
    );
  }
})

Swipeout.NativeButton = NativeButton;
Swipeout.SwipeoutButton = SwipeoutBtn;

export default Swipeout;
