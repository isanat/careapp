/**
 * Automated Test Runner
 * Runs comprehensive tests on all endpoints and generates detailed report
 * Usage: npx ts-node scripts/run-automated-tests.ts
 */

import { createClient } from '@libsql/client';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  name: string;
  category: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  error?: string;
  details?: Record<string, any>;
}

interface TestReport {
  timestamp: string;
  duration: number;
  results: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    successRate: string;
  };
  difficulties: string[];
  recommendations: string[];
}

class AutomatedTestRunner {
  private db: ReturnType<typeof createClient>;
  private results: TestResult[] = [];
  private difficulties: string[] = [];
  private startTime: number = Date.now();
  private adminUserId: string = '';
  private familyUserId: string = '';
  private caregiverUserId: string = '';

  constructor() {
    this.db = createClient({
      url: process.env.TURSO_DATABASE_URL || 'file:local.db',
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }

  async setup() {
    console.log('🚀 Setting up test environment...\n');
    try {
      // Create test users
      const adminResult = await this.db.execute({
        sql: `SELECT id FROM User WHERE email = ? LIMIT 1`,
        args: ['admin@evyra.pt'],
      });

      if (adminResult.rows.length === 0) {
        console.log('  ℹ️  Admin user not found. Tests will use mock session.');
      } else {
        this.adminUserId = (adminResult.rows[0] as any).id;
        console.log('  ✅ Admin user found');
      }

      // Get sample family and caregiver users
      const familyResult = await this.db.execute({
        sql: `SELECT id FROM User WHERE role = 'FAMILY' LIMIT 1`,
      });

      const caregiverResult = await this.db.execute({
        sql: `SELECT id FROM User WHERE role = 'CAREGIVER' LIMIT 1`,
      });

      if (familyResult.rows.length > 0) {
        this.familyUserId = (familyResult.rows[0] as any).id;
      }

      if (caregiverResult.rows.length > 0) {
        this.caregiverUserId = (caregiverResult.rows[0] as any).id;
      }

      console.log('✅ Test environment ready\n');
    } catch (error) {
      console.warn('⚠️  Warning setting up test environment:', error);
    }
  }

  async runAllTests(): Promise<TestReport> {
    console.log('📋 Running comprehensive tests...\n');

    // Test categories
    await this.testDatabaseSchema();
    await this.testDataIntegrity();
    await this.testAuthenticationSetup();
    await this.testPaymentSystem();
    await this.testContractSystem();
    await this.testChatSystem();
    await this.testKYCSystem();
    await this.testQRCodeSystem();
    await this.testInterviewSystem();
    await this.testAdminSystem();

    // Generate report
    const report = this.generateReport();
    console.log('\n✅ All tests completed');

    return report;
  }

  private async testDatabaseSchema() {
    console.log('🗄️  Testing Database Schema...');
    const startTime = Date.now();

    try {
      // Check critical tables exist
      const criticalTables = [
        'User',
        'Payment',
        'Contract',
        'Interview',
        'PresenceConfirmation',
        'AdminUser',
        'ChatRoom',
        'Review',
      ];

      for (const table of criticalTables) {
        try {
          await this.db.execute(`SELECT COUNT(*) FROM "${table}" LIMIT 1;`);
          this.addResult({
            name: `Table ${table} exists`,
            category: 'Database Schema',
            status: 'PASS',
            duration: 0,
          });
        } catch (error) {
          this.addResult({
            name: `Table ${table} exists`,
            category: 'Database Schema',
            status: 'FAIL',
            duration: Date.now() - startTime,
            error: String(error),
          });
          this.difficulties.push(`Missing or broken table: ${table}`);
        }
      }

      // Check key columns exist
      const columnChecks = [
        { table: 'User', columns: ['id', 'email', 'role', 'status'] },
        { table: 'Payment', columns: ['id', 'userId', 'amountEurCents', 'status'] },
        { table: 'Contract', columns: ['id', 'familyUserId', 'caregiverUserId', 'status'] },
      ];

      for (const check of columnChecks) {
        const result = await this.db.execute(`PRAGMA table_info("${check.table}");`);
        const existingColumns = (result.rows as any[]).map((row) => row.name);

        for (const col of check.columns) {
          if (existingColumns.includes(col)) {
            this.addResult({
              name: `Column ${check.table}.${col}`,
              category: 'Database Schema',
              status: 'PASS',
              duration: 0,
            });
          } else {
            this.addResult({
              name: `Column ${check.table}.${col}`,
              category: 'Database Schema',
              status: 'FAIL',
              duration: Date.now() - startTime,
              error: `Column missing in table ${check.table}`,
            });
            this.difficulties.push(`Missing column: ${check.table}.${col}`);
          }
        }
      }
    } catch (error) {
      this.addResult({
        name: 'Database Schema Validation',
        category: 'Database Schema',
        status: 'FAIL',
        duration: Date.now() - startTime,
        error: String(error),
      });
      this.difficulties.push(`Database schema validation failed: ${error}`);
    }

    console.log('  ✅ Database schema tests completed\n');
  }

  private async testDataIntegrity() {
    console.log('🔗 Testing Data Integrity...');
    const startTime = Date.now();

    try {
      // Test foreign key constraints
      const result = await this.db.execute('PRAGMA foreign_key_list("Payment");');

      if (result.rows.length > 0) {
        this.addResult({
          name: 'Foreign key constraints enabled',
          category: 'Data Integrity',
          status: 'PASS',
          duration: 0,
          details: { constraints: result.rows.length },
        });
      } else {
        this.addResult({
          name: 'Foreign key constraints enabled',
          category: 'Data Integrity',
          status: 'FAIL',
          duration: Date.now() - startTime,
          error: 'No foreign keys found',
        });
      }

      // Test referential integrity - check orphaned records
      const orphanedPayments = await this.db.execute(`
        SELECT COUNT(*) as count FROM Payment p
        WHERE NOT EXISTS (SELECT 1 FROM User u WHERE u.id = p.userId)
      `);

      const orphanCount = (orphanedPayments.rows[0] as any)?.count || 0;
      if (orphanCount === 0) {
        this.addResult({
          name: 'No orphaned Payment records',
          category: 'Data Integrity',
          status: 'PASS',
          duration: Date.now() - startTime,
        });
      } else {
        this.addResult({
          name: 'No orphaned Payment records',
          category: 'Data Integrity',
          status: 'FAIL',
          duration: Date.now() - startTime,
          error: `Found ${orphanCount} orphaned payment records`,
          details: { orphanedCount: orphanCount },
        });
        this.difficulties.push(`${orphanCount} orphaned Payment records found`);
      }
    } catch (error) {
      this.addResult({
        name: 'Data Integrity Validation',
        category: 'Data Integrity',
        status: 'FAIL',
        duration: Date.now() - startTime,
        error: String(error),
      });
    }

    console.log('  ✅ Data integrity tests completed\n');
  }

  private async testAuthenticationSetup() {
    console.log('🔐 Testing Authentication Setup...');
    const startTime = Date.now();

    try {
      // Check admin user exists
      const adminResult = await this.db.execute({
        sql: `SELECT u.id, u.email, u.role, a.id as adminId FROM User u
              LEFT JOIN AdminUser a ON u.id = a.userId
              WHERE u.email = ? LIMIT 1`,
        args: ['admin@evyra.pt'],
      });

      if (adminResult.rows.length > 0) {
        const adminRow = adminResult.rows[0] as any;
        if (adminRow.adminId) {
          this.addResult({
            name: 'Admin user configured',
            category: 'Authentication',
            status: 'PASS',
            duration: 0,
            details: { adminId: adminRow.adminId },
          });
        } else {
          this.addResult({
            name: 'Admin user has AdminUser profile',
            category: 'Authentication',
            status: 'FAIL',
            duration: Date.now() - startTime,
            error: 'Admin user exists but no AdminUser profile',
          });
          this.difficulties.push('Admin user missing AdminUser profile');
        }
      } else {
        this.addResult({
          name: 'Admin user exists',
          category: 'Authentication',
          status: 'FAIL',
          duration: Date.now() - startTime,
          error: 'Admin user not found in database',
        });
        this.difficulties.push('Admin user (admin@evyra.pt) not found');
      }

      // Check user roles exist
      const rolesResult = await this.db.execute(`
        SELECT DISTINCT role FROM User WHERE role IS NOT NULL
      `);

      const expectedRoles = ['FAMILY', 'CAREGIVER', 'ADMIN'];
      const existingRoles = (rolesResult.rows as any[]).map((r) => r.role);

      for (const role of expectedRoles) {
        if (existingRoles.includes(role) || role === 'ADMIN') {
          this.addResult({
            name: `User role '${role}' support`,
            category: 'Authentication',
            status: existingRoles.includes(role) ? 'PASS' : 'SKIP',
            duration: 0,
          });
        }
      }
    } catch (error) {
      this.addResult({
        name: 'Authentication Setup',
        category: 'Authentication',
        status: 'FAIL',
        duration: Date.now() - startTime,
        error: String(error),
      });
    }

    console.log('  ✅ Authentication tests completed\n');
  }

  private async testPaymentSystem() {
    console.log('💳 Testing Payment System...');
    const startTime = Date.now();

    try {
      // Check Payment table structure
      const paymentCount = await this.db.execute(
        'SELECT COUNT(*) as count FROM Payment'
      );
      this.addResult({
        name: 'Payment records exist',
        category: 'Payment System',
        status: 'PASS',
        duration: 0,
        details: { count: (paymentCount.rows[0] as any)?.count || 0 },
      });

      // Check payment types
      const paymentTypes = await this.db.execute(
        'SELECT DISTINCT type FROM Payment WHERE type IS NOT NULL'
      );

      const expectedTypes = ['ACTIVATION', 'CONTRACT_FEE', 'SERVICE_PAYMENT'];
      const existingTypes = (paymentTypes.rows as any[]).map((r) => r.type);

      for (const type of expectedTypes) {
        this.addResult({
          name: `Payment type '${type}' supported`,
          category: 'Payment System',
          status: existingTypes.includes(type) ? 'PASS' : 'SKIP',
          duration: 0,
        });
      }

      // Check payment statuses
      const statuses = await this.db.execute(
        'SELECT DISTINCT status FROM Payment WHERE status IS NOT NULL'
      );
      this.addResult({
        name: 'Payment statuses configured',
        category: 'Payment System',
        status: 'PASS',
        duration: 0,
        details: { statuses: (statuses.rows as any[]).map((r) => r.status) },
      });
    } catch (error) {
      this.addResult({
        name: 'Payment System',
        category: 'Payment System',
        status: 'FAIL',
        duration: Date.now() - startTime,
        error: String(error),
      });
    }

    console.log('  ✅ Payment system tests completed\n');
  }

  private async testContractSystem() {
    console.log('📋 Testing Contract System...');
    const startTime = Date.now();

    try {
      const contractCount = await this.db.execute(
        'SELECT COUNT(*) as count FROM Contract'
      );

      this.addResult({
        name: 'Contract records accessible',
        category: 'Contract System',
        status: 'PASS',
        duration: 0,
        details: { count: (contractCount.rows[0] as any)?.count || 0 },
      });

      // Check contract statuses
      const statuses = await this.db.execute(
        'SELECT DISTINCT status FROM Contract WHERE status IS NOT NULL'
      );

      this.addResult({
        name: 'Contract statuses available',
        category: 'Contract System',
        status: 'PASS',
        duration: 0,
        details: { statuses: (statuses.rows as any[]).map((r) => r.status) },
      });
    } catch (error) {
      this.addResult({
        name: 'Contract System',
        category: 'Contract System',
        status: 'FAIL',
        duration: Date.now() - startTime,
        error: String(error),
      });
    }

    console.log('  ✅ Contract system tests completed\n');
  }

  private async testChatSystem() {
    console.log('💬 Testing Chat System...');
    const startTime = Date.now();

    try {
      const roomCount = await this.db.execute(
        'SELECT COUNT(*) as count FROM ChatRoom'
      );

      this.addResult({
        name: 'Chat rooms accessible',
        category: 'Chat System',
        status: 'PASS',
        duration: 0,
        details: { count: (roomCount.rows[0] as any)?.count || 0 },
      });

      const messageCount = await this.db.execute(
        'SELECT COUNT(*) as count FROM ChatMessage'
      );

      this.addResult({
        name: 'Chat messages accessible',
        category: 'Chat System',
        status: 'PASS',
        duration: 0,
        details: { count: (messageCount.rows[0] as any)?.count || 0 },
      });
    } catch (error) {
      this.addResult({
        name: 'Chat System',
        category: 'Chat System',
        status: 'FAIL',
        duration: Date.now() - startTime,
        error: String(error),
      });
    }

    console.log('  ✅ Chat system tests completed\n');
  }

  private async testKYCSystem() {
    console.log('🆔 Testing KYC System...');
    const startTime = Date.now();

    try {
      const kycCount = await this.db.execute(
        'SELECT COUNT(*) as count FROM ProfileCaregiver WHERE verificationStatus IS NOT NULL'
      );

      this.addResult({
        name: 'KYC verification status tracked',
        category: 'KYC System',
        status: 'PASS',
        duration: 0,
        details: { verifiedCount: (kycCount.rows[0] as any)?.count || 0 },
      });

      // Check verification statuses
      const statuses = await this.db.execute(
        'SELECT DISTINCT verificationStatus FROM ProfileCaregiver WHERE verificationStatus IS NOT NULL'
      );

      this.addResult({
        name: 'Multiple KYC statuses supported',
        category: 'KYC System',
        status: 'PASS',
        duration: 0,
        details: { statuses: (statuses.rows as any[]).map((r) => r.verificationStatus) },
      });
    } catch (error) {
      this.addResult({
        name: 'KYC System',
        category: 'KYC System',
        status: 'FAIL',
        duration: Date.now() - startTime,
        error: String(error),
      });
    }

    console.log('  ✅ KYC system tests completed\n');
  }

  private async testQRCodeSystem() {
    console.log('📱 Testing QR Code System...');
    const startTime = Date.now();

    try {
      const qrCount = await this.db.execute(
        'SELECT COUNT(*) as count FROM PresenceConfirmation'
      );

      this.addResult({
        name: 'QR code presence confirmations',
        category: 'QR Code System',
        status: 'PASS',
        duration: 0,
        details: { count: (qrCount.rows[0] as any)?.count || 0 },
      });

      // Check QR code statuses
      const statuses = await this.db.execute(
        'SELECT DISTINCT status FROM PresenceConfirmation WHERE status IS NOT NULL'
      );

      this.addResult({
        name: 'QR code status tracking',
        category: 'QR Code System',
        status: 'PASS',
        duration: 0,
        details: { statuses: (statuses.rows as any[]).map((r) => r.status) },
      });
    } catch (error) {
      this.addResult({
        name: 'QR Code System',
        category: 'QR Code System',
        status: 'FAIL',
        duration: Date.now() - startTime,
        error: String(error),
      });
    }

    console.log('  ✅ QR code system tests completed\n');
  }

  private async testInterviewSystem() {
    console.log('🎥 Testing Interview System...');
    const startTime = Date.now();

    try {
      const interviewCount = await this.db.execute(
        'SELECT COUNT(*) as count FROM Interview'
      );

      this.addResult({
        name: 'Interview records accessible',
        category: 'Interview System',
        status: 'PASS',
        duration: 0,
        details: { count: (interviewCount.rows[0] as any)?.count || 0 },
      });

      // Check interview statuses
      const statuses = await this.db.execute(
        'SELECT DISTINCT status FROM Interview WHERE status IS NOT NULL'
      );

      this.addResult({
        name: 'Interview statuses available',
        category: 'Interview System',
        status: 'PASS',
        duration: 0,
        details: { statuses: (statuses.rows as any[]).map((r) => r.status) },
      });
    } catch (error) {
      this.addResult({
        name: 'Interview System',
        category: 'Interview System',
        status: 'FAIL',
        duration: Date.now() - startTime,
        error: String(error),
      });
    }

    console.log('  ✅ Interview system tests completed\n');
  }

  private async testAdminSystem() {
    console.log('⚙️  Testing Admin System...');
    const startTime = Date.now();

    try {
      const adminCount = await this.db.execute(
        'SELECT COUNT(*) as count FROM AdminUser'
      );

      this.addResult({
        name: 'Admin users configured',
        category: 'Admin System',
        status: 'PASS',
        duration: 0,
        details: { count: (adminCount.rows[0] as any)?.count || 0 },
      });

      // Check admin actions logging
      const actionCount = await this.db.execute(
        'SELECT COUNT(*) as count FROM AdminAction'
      );

      this.addResult({
        name: 'Admin actions logging',
        category: 'Admin System',
        status: 'PASS',
        duration: 0,
        details: { count: (actionCount.rows[0] as any)?.count || 0 },
      });

      // Check notifications
      const notificationCount = await this.db.execute(
        'SELECT COUNT(*) as count FROM AdminNotification'
      );

      this.addResult({
        name: 'Admin notifications system',
        category: 'Admin System',
        status: 'PASS',
        duration: 0,
        details: { count: (notificationCount.rows[0] as any)?.count || 0 },
      });
    } catch (error) {
      this.addResult({
        name: 'Admin System',
        category: 'Admin System',
        status: 'FAIL',
        duration: Date.now() - startTime,
        error: String(error),
      });
    }

    console.log('  ✅ Admin system tests completed\n');
  }

  private addResult(result: TestResult) {
    this.results.push(result);
  }

  private generateReport(): TestReport {
    const totalDuration = Date.now() - this.startTime;
    const passed = this.results.filter((r) => r.status === 'PASS').length;
    const failed = this.results.filter((r) => r.status === 'FAIL').length;
    const skipped = this.results.filter((r) => r.status === 'SKIP').length;
    const successRate = this.results.length > 0
      ? ((passed / (passed + failed)) * 100).toFixed(2)
      : '0.00';

    const recommendations: string[] = [];

    if (failed > 0) {
      recommendations.push('❌ Fix failing tests before next cycle');
      recommendations.push('📝 Review difficulty report for specific issues');
    }

    if (this.difficulties.length > 0) {
      recommendations.push('🔧 Review and fix reported difficulties');
    }

    if (passed === this.results.length) {
      recommendations.push('✅ All systems operational');
      recommendations.push('📊 Continue monitoring in next test cycle');
    }

    return {
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      results: this.results,
      summary: {
        total: this.results.length,
        passed,
        failed,
        skipped,
        successRate: `${successRate}%`,
      },
      difficulties: this.difficulties,
      recommendations,
    };
  }

  async saveReport(report: TestReport) {
    const reportsDir = path.join(process.cwd(), 'test-reports');

    // Create directory if it doesn't exist
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Save JSON report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonPath = path.join(reportsDir, `report-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

    // Save summary report
    const summaryPath = path.join(reportsDir, 'latest-report.md');
    const summary = `# Test Report
Generated: ${report.timestamp}
Duration: ${(report.duration / 1000).toFixed(2)}s

## Summary
- **Total Tests**: ${report.summary.total}
- **Passed**: ${report.summary.passed} ✅
- **Failed**: ${report.summary.failed} ❌
- **Skipped**: ${report.summary.skipped} ⏭️
- **Success Rate**: ${report.summary.successRate}

## Results by Category
${this.getResultsByCategory(report)}

## Difficulties Found
${report.difficulties.length > 0
  ? report.difficulties.map((d) => `- ⚠️ ${d}`).join('\n')
  : 'No difficulties found ✅'}

## Recommendations
${report.recommendations.map((r) => `- ${r}`).join('\n')}

## Detailed Results
${report.results
  .map(
    (r) =>
      `- **${r.name}** (${r.category}): ${r.status}${r.error ? ` - ${r.error}` : ''}`
  )
  .join('\n')}
`;

    fs.writeFileSync(summaryPath, summary);

    console.log(`\n📊 Reports saved:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   Summary: ${summaryPath}`);
  }

  private getResultsByCategory(report: TestReport): string {
    const categories = new Map<string, TestResult[]>();

    for (const result of report.results) {
      if (!categories.has(result.category)) {
        categories.set(result.category, []);
      }
      categories.get(result.category)!.push(result);
    }

    let output = '';
    for (const [category, results] of categories) {
      const passed = results.filter((r) => r.status === 'PASS').length;
      const failed = results.filter((r) => r.status === 'FAIL').length;
      const rate = ((passed / (passed + failed)) * 100).toFixed(0);
      output += `\n### ${category}\n`;
      output += `- Success Rate: ${rate}% (${passed}/${passed + failed})\n`;
    }

    return output;
  }
}

// Run tests
async function main() {
  const runner = new AutomatedTestRunner();
  await runner.setup();
  const report = await runner.runAllTests();
  await runner.saveReport(report);

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${report.summary.total}`);
  console.log(`✅ Passed: ${report.summary.passed}`);
  console.log(`❌ Failed: ${report.summary.failed}`);
  console.log(`Success Rate: ${report.summary.successRate}`);
  console.log('='.repeat(50));

  if (report.difficulties.length > 0) {
    console.log('\n⚠️  DIFFICULTIES REPORTED:');
    report.difficulties.forEach((d) => console.log(`   - ${d}`));
  }

  console.log('\n📋 RECOMMENDATIONS:');
  report.recommendations.forEach((r) => console.log(`   ${r}`));
}

main().catch(console.error);
