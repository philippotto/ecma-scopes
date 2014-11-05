// Load in dependencies
var expect = require('chai').expect;
var ecmaScopes = require('../');
var astUtils = require('./utils/ast');
var scriptUtils = require('./utils/script');

// Define our tests
function testBlockScope(filepath, type) {
  // Load our scope file
  scriptUtils.load(filepath, type);

  // Collect the parents for analysis within the lexical scope
  before(function collectParents () {
    // Find closest identifier to `root`
    var node = this.node = astUtils.findFirst(this.ast, {
      type: 'Identifier',
      name: 'block'
    });
    expect(node).to.not.equal(null);

    // Resolve the node's parents until we hit our scope type (e.g. `IfStatement`)
    this.parents = astUtils.findParentsUntil(node, {
      type: type
    });
  });

  it('is a block scope', function () {
    expect(this.vm).to.not.have.ownProperty('block');
  });

  it('is not a lexical scope', function () {
    expect(this.vm).to.have.ownProperty('lexical');
  });

  it('contains `block` inside of a "' + type + '"', function () {
    var container = this.parents[this.parents.length - 1];
    expect(this.parents).to.not.have.length(0);
    expect(container.type).to.equal(type);
  });

  it('does not contain `block` inside of lexical scopes and other block scopes', function () {
    // Collect the lexical and other block scopes
    var lexicalScopes = ecmaScopes.lexical;
    var otherBlockScopes = ecmaScopes.block.slice();
    otherBlockScopes.splice(otherBlockScopes.indexOf(type), 1);

    // Verify each of the nodes is not in there
    this.parents.forEach(function assertNotOtherScopes (parent) {
      expect(parent.type).to.not.equal(undefined);
      expect(lexicalScopes).to.not.contain(parent.type);
      expect(otherBlockScopes).to.not.contain(parent.type);
    });
  });
}

describe.only('ecma-scopes\' block scopes:', function () {
  // TODO: Remove `testScopes` and `slice`
  var testScopes = ['BlockStatement'];
  // testScopes.slice(-1).forEach(function testBlockCase (type) {
  // ecmaScopes.block.slice(-1).forEach(function testBlockCase (type) {
  ecmaScopes.block.forEach(function testBlockCase (type) {
    describe('a/an "' + type + '"', function () {
      // Resolve our test file e.g. `test-files/block-IfStatement.js`
      var filepath = __dirname + '/test-files/block-' + type + '.js';

      // Run the test
      testBlockScope(filepath, type);
    });
  });

  // TODO: Remove `return`
  // return;

  // DEV: Files in `test-files/{bad-syntax,invalid-scope}/` are a set of files which have "bad" syntax
  // TODO: Should we run them all in a try/catch/fail?

  // DEV: It looks like this isn't a valid test case
  describe.skip('a "ForStatement" without braces', function () {
    var filepath = __dirname + '/test-files/block-ForStatement-braceless.js';
    testBlockScope(filepath, 'ForStatement');
  });

  describe('a "BlockStatement" of a for loop', function () {
    var filepath = __dirname + '/test-files/block-BlockStatement-for-loop.js';
    testBlockScope(filepath, 'BlockStatement');
  });

  describe('an "IfStatement" without braces', function () {
    var filepath = __dirname + '/test-files/block-IfStatement-braceless-lexical-only.js';
    scriptUtils.load(filepath, 'IfStatement');

    it('defines a "BlockStatement" despite a lack of braces', function () {
      console.log(this.ast);
    });
  });

  // DEV: It looks like we cannot combine `let` and `with` due to requirement and restriction of strict mode
  describe('a "WithStatement"', function () {
    var filepath = __dirname + '/test-files/block-WithStatement-lexical-only.js';
    scriptUtils.load(filepath, 'WithStatement');

    it('does not affect lexical scoping', function () {
      expect(this.vm).to.have.ownProperty('lexical');
    });
  });
});
