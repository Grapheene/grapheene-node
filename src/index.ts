'use strict';

var Grapheene = require('./lib/Grapheene');
var webhooks = require('./webhooks/webhooks');
var obsolete = require('./base/obsolete');
var RequestClient = require('./base/RequestClient');

// Shorthand to automatically create a RestClient
export const initializer = function(uuid: string, api_key: string, opts: any) {
    return new Grapheene(uuid, api_key, opts);
};

// Main functional components of the Twilio module
initializer.Grapheene = Grapheene;
initializer.jwt = { };
initializer.twiml = { };
initializer.RequestClient = RequestClient;

var AccessToken;
Object.defineProperty(initializer.jwt,
    'AccessToken', {
        get: function() {
            return AccessToken = AccessToken || require('./jwt/AccessToken');
        }
    });

var ClientCapability;
Object.defineProperty(initializer.jwt,
    'ClientCapability', {
        get: function() {
            return ClientCapability = ClientCapability || require('./jwt/ClientCapability');
        }
    });

var taskrouter;
Object.defineProperty(initializer.jwt,
    'taskrouter', {
        get: function() {
            return taskrouter = taskrouter || {
                TaskRouterCapability: require('./jwt/taskrouter/TaskRouterCapability'),
                util: require('./jwt/taskrouter/util')
            };
        }
    });

var VoiceResponse;
Object.defineProperty(initializer.twiml,
    'VoiceResponse', {
        get: function() {
            return VoiceResponse = VoiceResponse || require('./twiml/VoiceResponse');
        }
    });

var MessagingResponse;
Object.defineProperty(initializer.twiml,
    'MessagingResponse', {
        get: function() {
            return MessagingResponse = MessagingResponse || require('./twiml/MessagingResponse');
        }
    });

var FaxResponse;
Object.defineProperty(initializer.twiml,
    'FaxResponse', {
        get: function() {
            return FaxResponse = FaxResponse || require('./twiml/FaxResponse');
        }
    });

// Add obsolete clients
initializer.RestClient = obsolete.RestClient;
initializer.PricingClient = obsolete.PricingClient;
initializer.MonitorClient = obsolete.MonitorClient;
initializer.TaskRouterClient = obsolete.TaskRouterClient;
initializer.IpMessagingClient = obsolete.IpMessagingClient;
initializer.LookupsClient = obsolete.LookupsClient;
initializer.TrunkingClient = obsolete.TrunkingClient;

// Setup webhook helper functionality
initializer.validateRequest = webhooks.validateRequest;
initializer.validateRequestWithBody = webhooks.validateRequestWithBody;
initializer.validateExpressRequest = webhooks.validateExpressRequest;
initializer.webhook = webhooks.webhook;