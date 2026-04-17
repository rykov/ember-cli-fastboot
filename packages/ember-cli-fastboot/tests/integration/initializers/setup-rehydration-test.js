/* eslint-disable prettier/prettier */
import { module, test } from 'qunit';
import {
  initialize,
  isRehydrationEnabled,
  _resetRehydration,
} from 'ember-cli-fastboot/initializers/setup-rehydration';

module('Initializer: setup-rehydration', function(hooks) {
  let fixtureContainer;

  hooks.beforeEach(function() {
    // Use #qunit-fixture so QUnit automatically cleans up after each test
    fixtureContainer = document.getElementById('qunit-fixture');
  });

  hooks.afterEach(function() {
    _resetRehydration();
    fixtureContainer.innerHTML = '';
  });

  test('it enables rehydration and removes markers when serialization node is present', function(assert) {
    fixtureContainer.innerHTML = '';
    let start = document.createElement('script');
    start.type = 'x/boundary';
    start.id = 'fastboot-body-start';
    fixtureContainer.appendChild(start);

    // Glimmer serialization comment node
    let comment = document.createComment('%+b:0%');
    fixtureContainer.appendChild(comment);

    let content = document.createElement('div');
    content.id = 'rehydratable-content';
    fixtureContainer.appendChild(content);

    let end = document.createElement('script');
    end.type = 'x/boundary';
    end.id = 'fastboot-body-end';
    fixtureContainer.appendChild(end);

    initialize();

    assert.true(isRehydrationEnabled(), 'rehydration is enabled');
    assert.notOk(
      document.getElementById('fastboot-body-start'),
      'start marker is removed'
    );
    assert.notOk(
      document.getElementById('fastboot-body-end'),
      'end marker is removed'
    );
    assert.ok(
      document.getElementById('rehydratable-content'),
      'rehydratable content is preserved'
    );
  });

  test('it does nothing when fastboot-body-start is absent', function(assert) {
    fixtureContainer.innerHTML = '<div id="regular-content"></div>';

    initialize();

    assert.false(isRehydrationEnabled(), 'rehydration is not enabled');
    assert.ok(
      document.getElementById('regular-content'),
      'regular content is untouched'
    );
  });

  test('it does nothing when next sibling is not a serialization node', function(assert) {
    let start = document.createElement('script');
    start.type = 'x/boundary';
    start.id = 'fastboot-body-start';
    fixtureContainer.appendChild(start);

    // Plain text node, not a serialization comment
    let text = document.createTextNode('not a comment');
    fixtureContainer.appendChild(text);

    let end = document.createElement('script');
    end.type = 'x/boundary';
    end.id = 'fastboot-body-end';
    fixtureContainer.appendChild(end);

    initialize();

    assert.false(isRehydrationEnabled(), 'rehydration is not enabled');
    assert.ok(
      document.getElementById('fastboot-body-start'),
      'start marker is still present'
    );
    assert.ok(
      document.getElementById('fastboot-body-end'),
      'end marker is still present'
    );
  });

  test('it does nothing when comment does not match serialization pattern', function(assert) {
    let start = document.createElement('script');
    start.type = 'x/boundary';
    start.id = 'fastboot-body-start';
    fixtureContainer.appendChild(start);

    // Comment that does not match Glimmer serialization format
    let comment = document.createComment('not-a-serialization-node');
    fixtureContainer.appendChild(comment);

    let end = document.createElement('script');
    end.type = 'x/boundary';
    end.id = 'fastboot-body-end';
    fixtureContainer.appendChild(end);

    initialize();

    assert.false(isRehydrationEnabled(), 'rehydration is not enabled');
    assert.ok(
      document.getElementById('fastboot-body-start'),
      'start marker is still present'
    );
    assert.ok(
      document.getElementById('fastboot-body-end'),
      'end marker is still present'
    );
  });

  test('it handles missing fastboot-body-end gracefully', function(assert) {
    let start = document.createElement('script');
    start.type = 'x/boundary';
    start.id = 'fastboot-body-start';
    fixtureContainer.appendChild(start);

    let comment = document.createComment('%+b:0%');
    fixtureContainer.appendChild(comment);

    initialize();

    assert.true(isRehydrationEnabled(), 'rehydration is enabled');
    assert.notOk(
      document.getElementById('fastboot-body-start'),
      'start marker is removed'
    );
  });

  test('it recognizes serialization nodes with various block indices', function(assert) {
    let start = document.createElement('script');
    start.type = 'x/boundary';
    start.id = 'fastboot-body-start';
    fixtureContainer.appendChild(start);

    // Higher block index
    let comment = document.createComment('%+b:42%');
    fixtureContainer.appendChild(comment);

    let end = document.createElement('script');
    end.type = 'x/boundary';
    end.id = 'fastboot-body-end';
    fixtureContainer.appendChild(end);

    initialize();

    assert.true(isRehydrationEnabled(), 'rehydration is enabled');
    assert.notOk(
      document.getElementById('fastboot-body-start'),
      'start marker is removed for block index 42'
    );
    assert.notOk(
      document.getElementById('fastboot-body-end'),
      'end marker is removed'
    );
  });

  test('_resetRehydration disables the rehydration flag', function(assert) {
    let start = document.createElement('script');
    start.type = 'x/boundary';
    start.id = 'fastboot-body-start';
    fixtureContainer.appendChild(start);

    let comment = document.createComment('%+b:0%');
    fixtureContainer.appendChild(comment);

    initialize();
    assert.true(isRehydrationEnabled(), 'rehydration is enabled after initialize');

    _resetRehydration();
    assert.false(isRehydrationEnabled(), 'rehydration is disabled after reset');
  });
});
