/* eslint-disable prettier/prettier */
import ApplicationInstance from '@ember/application/instance';

// Glimmer's serialization builder inserts comment nodes like <!--%+b:0%-->
// to mark the start of serialized blocks. This check avoids depending on
// private Ember/Glimmer APIs.
function isSerializationFirstNode(node) {
  return (
    node !== null &&
    node.nodeType === 8 && // Node.COMMENT_NODE
    /^%\+b:\d+%$/.test(node.nodeValue)
  );
}

// Module-scoped flag so that the _bootSync override (which is permanent once
// reopened) can be disabled again — important for test isolation.
let _rehydrationEnabled = false;
let _reopened = false;

export function isRehydrationEnabled() {
  return _rehydrationEnabled;
}

// Exported for test teardown only.
export function _resetRehydration() {
  _rehydrationEnabled = false;
}

export function initialize() {
  if (typeof FastBoot !== 'undefined') {
    return;
  }

  let current = document.getElementById('fastboot-body-start');
  if (!current) {
    return;
  }

  if (!isSerializationFirstNode(current.nextSibling)) {
    return;
  }

  _rehydrationEnabled = true;

  // Only reopen the class once — subsequent calls just flip the flag above.
  if (!_reopened) {
    _reopened = true;
    ApplicationInstance.reopen({
      _bootSync(options) {
        if (_rehydrationEnabled && options === undefined) {
          options = { _renderMode: 'rehydrate' };
        }

        return this._super(options);
      },
    });
  }

  // Remove markers so that the clear-double-boot instance initializer
  // does not strip the pre-rendered content that we want to rehydrate.
  current.parentNode.removeChild(current);
  let end = document.getElementById('fastboot-body-end');
  if (end) {
    end.parentNode.removeChild(end);
  }
}

export default {
  name: 'setup-rehydration',
  initialize,
};
