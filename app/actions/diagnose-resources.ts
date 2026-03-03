'use server';

import { createClient } from '@/utils/supabase/server';

/**
 * Diagnostic tool to check what resources exist in Supabase
 * Run this to understand why recommendations are empty
 */
export async function diagnoseResources() {
  const supabase = await createClient();

  console.log('\n' + '='.repeat(70));
  console.log('🔍 RESOURCE DIAGNOSTIC TOOL');
  console.log('='.repeat(70));

  // Check total resources
  const { data: allResources, error: allError } = await supabase
    .from('resources')
    .select('*');

  if (allError) {
    console.error('❌ Database error:', allError);
    return { error: allError.message };
  }

  console.log(`\n📊 Total resources in database: ${allResources?.length || 0}`);

  if (!allResources || allResources.length === 0) {
    console.log('⚠️  Database is empty! You need to seed resources.');
    return { 
      error: 'No resources found in database',
      needsSeeding: true 
    };
  }

  // Analyze by grade
  const byGrade = allResources.reduce((acc: any, r: any) => {
    acc[r.target_grade] = (acc[r.target_grade] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📚 Resources by Grade:');
  Object.entries(byGrade).forEach(([grade, count]) => {
    console.log(`  ${grade}: ${count} resources`);
  });

  // Analyze by subject
  const bySubject = allResources.reduce((acc: any, r: any) => {
    acc[r.subject] = (acc[r.subject] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📖 Resources by Subject:');
  Object.entries(bySubject).forEach(([subject, count]) => {
    console.log(`  ${subject}: ${count} resources`);
  });

  // Analyze by difficulty
  const byDifficulty = allResources.reduce((acc: any, r: any) => {
    acc[r.difficulty] = (acc[r.difficulty] || 0) + 1;
    return acc;
  }, {});

  console.log('\n⚡ Resources by Difficulty:');
  Object.entries(byDifficulty).forEach(([difficulty, count]) => {
    console.log(`  ${difficulty}: ${count} resources`);
  });

  // Test specific query: Class 9, Mathematics, Weak confidence
  console.log('\n' + '-'.repeat(70));
  console.log('🎯 TEST CASE: Class 9, Mathematics, Weak Confidence');
  console.log('-'.repeat(70));

  const { data: testResources, error: testError } = await supabase
    .from('resources')
    .select('*')
    .eq('target_grade', 'Class 9')
    .eq('subject', 'Mathematics')
    .in('difficulty', ['Beginner', 'Medium']);

  if (testError) {
    console.error('❌ Test query error:', testError);
  } else {
    console.log(`✅ Found ${testResources?.length || 0} matching resources`);
    
    if (testResources && testResources.length > 0) {
      console.log('\nSample resources:');
      testResources.slice(0, 3).forEach((r: any, i: number) => {
        console.log(`  ${i + 1}. ${r.title} (${r.difficulty}, ${r.format})`);
      });
    } else {
      console.log('⚠️  No resources match this criteria!');
      console.log('\n💡 SOLUTION: You need to add resources with:');
      console.log('   - target_grade: "Class 9"');
      console.log('   - subject: "Mathematics"');
      console.log('   - difficulty: "Beginner" or "Medium"');
    }
  }

  console.log('\n' + '='.repeat(70));

  return {
    total: allResources.length,
    byGrade,
    bySubject,
    byDifficulty,
    testCaseResults: testResources?.length || 0,
  };
}
