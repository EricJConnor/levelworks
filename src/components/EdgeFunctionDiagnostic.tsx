import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle, Loader2, RefreshCw, HelpCircle, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
  responseCode?: number;
  responseBody?: string;
}

export const EdgeFunctionDiagnostic: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<string | null>(null);

  const testEdgeFunction = async (functionName: string): Promise<TestResult> => {
    try {
      console.log(`[Diagnostic] Testing ${functionName} via supabase.functions.invoke`);
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { test: true }
      });

      console.log(`[Diagnostic] ${functionName} response:`, { data, error });
      
      // Check for FunctionsHttpError (404 = function not deployed)
      if (error) {
        const errorMessage = error.message || '';
        
        // Check if it's a 404 (not deployed)
        if (errorMessage.includes('404') || errorMessage.includes('not found')) {
          return {
            name: functionName,
            status: 'error',
            message: 'NOT DEPLOYED',
            details: 'This edge function is not deployed to Supabase.',
            responseBody: errorMessage
          };
        }
        
        return {
          name: functionName,
          status: 'error',
          message: 'ERROR',
          details: errorMessage,
          responseBody: errorMessage
        };
      }

      // Check response data for specific errors
      if (data?.error) {
        // "Email service not configured" means RESEND_API_KEY is missing
        if (data.error.includes('Email service not configured')) {
          return {
            name: functionName,
            status: 'error',
            message: 'RESEND_API_KEY NOT SET',
            details: 'The RESEND_API_KEY secret is not configured in Supabase Edge Functions.',
            responseBody: JSON.stringify(data)
          };
        }
        
        // Some errors are expected for test calls (missing required fields)
        if (data.error.includes('Missing') || data.error.includes('required') || data.error.includes('Recipient')) {
          return {
            name: functionName,
            status: 'success',
            message: 'DEPLOYED & WORKING',
            details: 'Function is deployed and responding correctly (validation error expected for test).',
            responseBody: JSON.stringify(data)
          };
        }
        
        return {
          name: functionName,
          status: 'warning',
          message: 'DEPLOYED (with error)',
          details: `Function responded with: ${data.error}`,
          responseBody: JSON.stringify(data)
        };
      }

      return {
        name: functionName,
        status: 'success',
        message: 'DEPLOYED & WORKING',
        details: 'Function is deployed and responding correctly.',
        responseBody: JSON.stringify(data)
      };
    } catch (networkError: any) {
      console.error(`[Diagnostic] Error for ${functionName}:`, networkError);
      return {
        name: functionName,
        status: 'error',
        message: 'ERROR',
        details: `Could not reach the function: ${networkError.message}`
      };
    }
  };

  const runDiagnostics = async () => {
    setTesting(true);
    setResults([]);

    const functionsToTest = ['send-email', 'send-estimate', 'send-invoice'];
    const newResults: TestResult[] = [];

    for (const fn of functionsToTest) {
      const result = await testEdgeFunction(fn);
      newResults.push(result);
      setResults([...newResults]);
    }

    setTesting(false);
  };

  const sendTestEmailNow = async () => {
    if (!testEmail.trim()) {
      setTestEmailResult('Please enter an email address');
      return;
    }

    setSendingTestEmail(true);
    setTestEmailResult(null);

    try {
      const { data: result, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: testEmail.trim(),
          templateType: 'estimate_sent',
          data: {
            clientName: 'Test User',
            projectName: 'Diagnostic Test',
            amount: '100.00',
            estimateUrl: window.location.origin + '/test',
            contractorName: 'Test Contractor'
          }
        }
      });

      console.log('[Diagnostic] Test email response:', { result, error });

      if (error) {
        setTestEmailResult(`FAILED: ${error.message}`);
      } else if (result?.success !== false && !result?.error) {
        setTestEmailResult(`SUCCESS! Email sent to ${testEmail}. Check your inbox (and spam folder).`);
      } else {
        setTestEmailResult(`FAILED: ${result?.error || result?.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('[Diagnostic] Test email error:', err);
      setTestEmailResult(`ERROR: ${err.message}`);
    } finally {
      setSendingTestEmail(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Loader2 className="w-5 h-5 animate-spin text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Working</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Testing...</Badge>;
    }
  };

  const hasErrors = results.some(r => r.status === 'error');
  const hasApiKeyError = results.some(r => r.message.includes('RESEND_API_KEY'));
  const hasNotDeployed = results.some(r => r.message === 'NOT DEPLOYED');
  const allSuccess = results.length > 0 && results.every(r => r.status === 'success');

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Email Function Diagnostic
            </CardTitle>
            <CardDescription>
              Test if your email functions are set up correctly
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowHelp(!showHelp)}
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showHelp && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <h4 className="font-semibold text-blue-800 mb-2">What does this test?</h4>
            <p className="text-blue-700 mb-2">
              This checks if the email-sending edge functions are properly deployed and configured.
            </p>
            <h4 className="font-semibold text-blue-800 mb-2">Common Issues:</h4>
            <ul className="text-blue-700 list-disc list-inside space-y-1">
              <li><strong>NOT DEPLOYED</strong> - The edge function needs to be deployed to Supabase</li>
              <li><strong>RESEND_API_KEY NOT SET</strong> - Add the secret in Supabase Dashboard → Project Settings → Edge Functions → Secrets</li>
              <li><strong>NETWORK ERROR</strong> - Check your internet connection</li>
            </ul>
          </div>
        )}

        <Button 
          onClick={runDiagnostics} 
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Testing Functions...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Run Diagnostic Test
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            {/* Summary */}
            {allSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">All functions are working!</span>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  Your email functions are properly deployed and configured.
                </p>
              </div>
            )}

            {hasApiKeyError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <XCircle className="w-5 h-5" />
                  <span className="font-semibold">RESEND_API_KEY Not Configured!</span>
                </div>
                <p className="text-red-700 text-sm mt-2">
                  The RESEND_API_KEY secret is missing from your Supabase Edge Functions.
                </p>
                <div className="mt-3 text-sm text-red-700">
                  <strong>To fix:</strong>
                  <ol className="list-decimal list-inside mt-1 space-y-1">
                    <li>Go to Supabase Dashboard</li>
                    <li>Navigate to Project Settings → Edge Functions → Secrets</li>
                    <li>Add a new secret named <code className="bg-red-100 px-1 rounded">RESEND_API_KEY</code></li>
                    <li>Set the value to your Resend API key</li>
                  </ol>
                </div>
              </div>
            )}

            {hasNotDeployed && !hasApiKeyError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <XCircle className="w-5 h-5" />
                  <span className="font-semibold">Edge Functions Not Deployed!</span>
                </div>
                <p className="text-red-700 text-sm mt-1">
                  One or more edge functions are not deployed. See DEPLOY_EDGE_FUNCTIONS.md for instructions.
                </p>
              </div>
            )}

            {/* Individual Results */}
            <div className="border rounded-lg divide-y">
              {results.map((result, index) => (
                <div key={index} className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      <span className="font-medium">{result.name}</span>
                    </div>
                    {getStatusBadge(result.status)}
                  </div>
                  <p className="text-sm text-gray-600 ml-7">{result.message}</p>
                  {result.details && (
                    <p className="text-xs text-gray-500 ml-7 mt-1">{result.details}</p>
                  )}
                  {result.responseCode && (
                    <p className="text-xs text-gray-400 ml-7 mt-1">HTTP {result.responseCode}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Email Section */}
        {allSuccess && (
          <div className="border-t pt-4 mt-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Send Test Email
            </h4>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
              />
              <Button
                onClick={sendTestEmailNow}
                disabled={sendingTestEmail}
                size="sm"
              >
                {sendingTestEmail ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Send Test'
                )}
              </Button>
            </div>
            {testEmailResult && (
              <p className={`text-sm mt-2 ${testEmailResult.startsWith('SUCCESS') ? 'text-green-600' : 'text-red-600'}`}>
                {testEmailResult}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
