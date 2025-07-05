"""
AI services for task enhancement and context processing using Google Gemini API.
"""
import json
import re
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from django.conf import settings
from django.utils import timezone
import google.generativeai as genai


class AIServiceBase:
    """Base class for AI services."""
    
    def __init__(self):
        """Initialize the AI service with Gemini API."""
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel('models/gemini-1.5-flash')
        else:
            self.model = None
    
    def _call_gemini(self, prompt: str, max_retries: int = 3) -> str:
        """Call Gemini API with retry logic."""
        if not self.model:
            raise Exception("Gemini API not configured")
        
        for attempt in range(max_retries):
            try:
                response = self.model.generate_content(prompt)
                return response.text
            except Exception as e:
                if attempt == max_retries - 1:
                    raise e
                continue
        
        raise Exception("Failed to get response from Gemini API")
    
    def _extract_json_from_response(self, response_text: str) -> Dict[str, Any]:
        """Extract JSON from AI response."""
        try:
            # Try to find JSON in the response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            
            # If no JSON found, try to parse the whole response
            return json.loads(response_text)
        except Exception:
            # Fallback: parse structured text response
            return self._parse_structured_response(response_text)
    
    def _parse_structured_response(self, response_text: str) -> Dict[str, Any]:
        """Parse structured text response as fallback."""
        result = {}
        lines = response_text.strip().split('\n')
        
        current_key = None
        current_value = []
        
        for line in lines:
            line = line.strip()
            if ':' in line and not line.startswith('-'):
                if current_key:
                    result[current_key] = '\n'.join(current_value).strip()
                
                parts = line.split(':', 1)
                current_key = parts[0].strip().lower().replace(' ', '_')
                current_value = [parts[1].strip()] if len(parts) > 1 else []
            elif current_key:
                current_value.append(line)
        
        if current_key:
            result[current_key] = '\n'.join(current_value).strip()
        
        return result


class AITaskService(AIServiceBase):
    """AI service for task enhancement and management."""
    
    def enhance_task(self, task, context_data: Optional[list] = None) -> Dict[str, Any]:
        """Enhance a task with AI-powered suggestions."""
        context_data = context_data if context_data is not None else []
        
        prompt = self._build_task_enhancement_prompt(task, context_data)
        response = self._call_gemini(prompt)
        suggestions = self._extract_json_from_response(response)
        
        # Update task with AI suggestions
        task.ai_enhanced_description = suggestions.get('enhanced_description', task.description)
        task.ai_suggested_deadline = self._parse_deadline(suggestions.get('suggested_deadline', ''))
        task.ai_suggested_category = suggestions.get('suggested_category', '')
        try:
            score = float(suggestions.get('priority_score', 50))
            score = max(0, min(100, score))
            task.priority_score = score
        except Exception:
            task.priority_score = 50
        task.save()
        
        return suggestions
    
    def _build_task_enhancement_prompt(self, task, context_data: List[str]) -> str:
        """Build prompt for task enhancement."""
        context_str = '\n'.join(f"- {ctx}" for ctx in context_data) if context_data else "No additional context"
        
        return f"""
As an AI task management assistant, analyze the following task and provide intelligent enhancements.

TASK DETAILS:
Title: {task.title}
Description: {task.description or 'No description provided'}
Current Category: {task.category.name if task.category else 'Uncategorized'}
Current Priority: {task.priority}

CONTEXT DATA:
{context_str}

Please provide enhancements in the following JSON format:
{{
    "enhanced_description": "Improved task description with context-aware details",
    "suggested_deadline": "YYYY-MM-DD HH:MM:SS",
    "suggested_category": "Recommended category name",
    "suggested_tags": ["tag1", "tag2", "tag3"],
    "priority_score": 85,  # 0-100, higher means more important
    "reasoning": "Explanation of why these suggestions were made",
    "confidence_score": 0.85
}}

Consider:
1. Task complexity and estimated effort
2. Context relevance and urgency indicators
3. Realistic deadline based on current date ({timezone.now().strftime('%Y-%m-%d')})
4. Category suggestions based on task content
5. Priority scoring (0-100) based on urgency and importance
6. Useful tags for organization
"""
    
    def _parse_deadline(self, deadline_str: Optional[str]) -> Optional[datetime]:
        """Parse deadline string to datetime object."""
        if not deadline_str or not isinstance(deadline_str, str):
            return None
        
        try:
            # Try multiple date formats
            formats = [
                '%Y-%m-%d %H:%M:%S',
                '%Y-%m-%d',
                '%d/%m/%Y %H:%M',
                '%d/%m/%Y'
            ]
            
            for fmt in formats:
                try:
                    dt = datetime.strptime(deadline_str, fmt)
                    return timezone.make_aware(dt)
                except ValueError:
                    continue
            
            return None
        except Exception:
            return None
    
    def recalculate_priority(self, task) -> float:
        """Recalculate task priority based on current context."""
        prompt = f"""
Analyze this task and calculate a priority score (0-100) based on:

TASK: {task.title}
DESCRIPTION: {task.description or 'No description'}
CURRENT DEADLINE: {task.deadline or 'No deadline set'}
STATUS: {task.status}
CREATED: {task.created_at.strftime('%Y-%m-%d')}

Consider:
1. Deadline urgency
2. Task complexity
3. Current status
4. How long it's been pending

Return only a number between 0-100 representing the priority score.
"""
        
        try:
            response = self._call_gemini(prompt)
            match = re.search(r'\d+\.?\d*', response)
            if match:
                priority_score = float(match.group())
                return max(0.0, min(100.0, priority_score))
            return task.priority_score
        except Exception:
            return task.priority_score
    
    def suggest_tasks_from_context(self, context_entries) -> List[Dict[str, Any]]:
        """Suggest new tasks based on context entries."""
        if not context_entries:
            return []
        
        context_text = '\n'.join([
            f"[{entry.source_type}] {entry.content[:200]}"
            for entry in context_entries[:10]  # Limit to 10 entries
        ])
        
        prompt = f"""
Based on the following context entries, suggest actionable tasks that should be added to a todo list.

CONTEXT ENTRIES:
{context_text}

Please suggest tasks in the following JSON format:
{{
    "suggested_tasks": [
        {{
            "title": "Task title",
            "description": "Detailed description",
            "priority": "high/medium/low",
            "category": "suggested category",
            "deadline": "YYYY-MM-DD",
            "reasoning": "Why this task is suggested"
        }}
    ]
}}

Consider:
1. Actionable items from messages and emails
2. Important deadlines mentioned
3. Follow-up actions needed
4. Personal commitments and reminders
"""
        
        try:
            response = self._call_gemini(prompt)
            result = self._extract_json_from_response(response)
            return result.get('suggested_tasks', [])
        except Exception as e:
            print(f"Error suggesting tasks: {e}")
            return []
    
    def get_task_recommendations(self, user, limit: int = 5) -> List[Dict[str, Any]]:
        """Get AI-powered task recommendations for a user."""
        # Get user's recent tasks and context
        from tasks.models import Task
        from context.models import ContextEntry
        
        recent_tasks = Task.objects.filter(user=user).order_by('-created_at')[:10]
        recent_context = ContextEntry.objects.filter(user=user).order_by('-created_at')[:10]
        
        task_summary = '\n'.join([
            f"- {task.title} ({task.status})"
            for task in recent_tasks
        ])
        
        context_summary = '\n'.join([
            f"- {entry.content[:100]}"
            for entry in recent_context
        ])
        
        prompt = f"""
Based on the user's recent activity, suggest task recommendations.

RECENT TASKS:
{task_summary}

RECENT CONTEXT:
{context_summary}

Please provide recommendations in the following JSON format:
{{
    "recommendations": [
        {{
            "title": "Recommended task",
            "description": "Why this task is recommended",
            "priority": "high/medium/low",
            "category": "suggested category",
            "deadline": "YYYY-MM-DD",
            "reasoning": "Explanation"
        }}
    ]
}}
"""
        
        try:
            response = self._call_gemini(prompt)
            result = self._extract_json_from_response(response)
            return result.get('recommendations', [])
        except Exception as e:
            print(f"Error getting recommendations: {e}")
            return []


class AIContextService(AIServiceBase):
    """AI service for context processing and analysis."""
    
    def process_context(self, context_entry) -> Dict[str, Any]:
        """Process a context entry with AI analysis."""
        prompt = self._build_context_analysis_prompt(context_entry)
        response = self._call_gemini(prompt)
        analysis = self._extract_json_from_response(response)
        
        # Update context entry with AI insights
        context_entry.processed_insights = analysis
        context_entry.sentiment_score = analysis.get('sentiment_score', 0.0)
        context_entry.keywords = analysis.get('keywords', [])
        context_entry.entities = analysis.get('entities', [])
        context_entry.relevance_score = analysis.get('relevance_score', 0.0)
        context_entry.task_suggestions = analysis.get('task_suggestions', [])
        context_entry.is_processed = True
        context_entry.save()
        
        return analysis
    
    def _build_context_analysis_prompt(self, context_entry) -> str:
        """Build prompt for context analysis."""
        return f"""
Analyze the following context entry and extract insights.

CONTEXT ENTRY:
Source: {context_entry.get_source_type_display()}
Content: {context_entry.content}
Date: {context_entry.context_date}

Please provide analysis in the following JSON format:
{{
    "sentiment_score": 0.5,
    "keywords": ["keyword1", "keyword2"],
    "entities": [
        {{
            "type": "person/location/date/organization",
            "value": "entity value"
        }}
    ],
    "relevance_score": 7.5,
    "task_suggestions": [
        {{
            "title": "Suggested task",
            "description": "Task description",
            "priority": "high/medium/low"
        }}
    ],
    "insights": "Key insights from this context"
}}

Consider:
1. Sentiment analysis (-1 to 1)
2. Important keywords and entities
3. Relevance to task management (0-10)
4. Actionable task suggestions
5. Key insights and patterns
"""
    
    def analyze_context(self, context_entry) -> Dict[str, Any]:
        """Analyze a specific context entry."""
        return self.process_context(context_entry)
    
    def generate_summary(self, context_entries, start_date, end_date) -> Dict[str, Any]:
        """Generate summary from context entries in a date range."""
        if not context_entries:
            return {"summary": "No context entries found for the specified period."}
        
        context_summary = '\n'.join([
            f"[{entry.source_type}] {entry.content[:150]}"
            for entry in context_entries
        ])
        
        prompt = f"""
Generate a comprehensive summary of the following context entries from {start_date} to {end_date}.

CONTEXT ENTRIES:
{context_summary}

Please provide a summary in the following JSON format:
{{
    "key_themes": ["theme1", "theme2"],
    "important_events": ["event1", "event2"],
    "action_items": ["action1", "action2"],
    "sentiment_trend": "positive/negative/neutral",
    "productivity_insights": "Insights about productivity patterns",
    "recommendations": ["recommendation1", "recommendation2"]
}}
"""
        
        try:
            response = self._call_gemini(prompt)
            return self._extract_json_from_response(response)
        except Exception as e:
            print(f"Error generating summary: {e}")
            return {"error": str(e)}


class AIInsightService(AIServiceBase):
    """AI service for generating insights and recommendations."""
    
    def generate_daily_insights(self, user, date=None) -> List[Dict[str, Any]]:
        """Generate daily insights for a user."""
        if date is None:
            date = timezone.now().date()
        
        # Get tasks and context for the specified date
        from tasks.models import Task
        from context.models import ContextEntry
        
        tasks = Task.objects.filter(
            user=user,
            created_at__date=date
        )
        
        context_entries = ContextEntry.objects.filter(
            user=user,
            context_date__date=date
        )
        
        task_summary = '\n'.join([
            f"- {task.title} ({task.status})"
            for task in tasks
        ])
        
        context_summary = '\n'.join([
            f"- {entry.content[:100]}"
            for entry in context_entries
        ])
        
        prompt = self._build_daily_insights_prompt(tasks, context_entries, date)
        
        try:
            response = self._call_gemini(prompt)
            return self._extract_json_from_response(response).get('insights', [])
        except Exception as e:
            print(f"Error generating daily insights: {e}")
            return []
    
    def _build_daily_insights_prompt(self, tasks, context_entries, date) -> str:
        """Build prompt for daily insights."""
        task_count = tasks.count()
        completed_count = tasks.filter(status='completed').count()
        context_count = context_entries.count()
        
        return f"""
Generate daily insights for {date} based on the following data:

TASKS ({task_count} total, {completed_count} completed):
{chr(10).join([f"- {task.title} ({task.status})" for task in tasks])}

CONTEXT ENTRIES ({context_count}):
{chr(10).join([f"- {entry.content[:100]}" for entry in context_entries])}

Please provide insights in the following JSON format:
{{
    "insights": [
        {{
            "type": "productivity/pattern/recommendation",
            "title": "Insight title",
            "description": "Detailed insight description",
            "confidence": 0.85,
            "actionable": true
        }}
    ]
}}

Focus on:
1. Productivity patterns
2. Task completion trends
3. Context-task relationships
4. Improvement recommendations
"""
    
    def analyze_productivity_patterns(self, user, days=30) -> Dict[str, Any]:
        """Analyze productivity patterns over a period."""
        from tasks.models import Task
        from context.models import ContextEntry
        
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        tasks = Task.objects.filter(
            user=user,
            created_at__range=(start_date, end_date)
        )
        
        context_entries = ContextEntry.objects.filter(
            user=user,
            context_date__range=(start_date, end_date)
        )
        
        # Calculate basic statistics
        total_tasks = tasks.count()
        completed_tasks = tasks.filter(status='completed').count()
        completion_rate = (completed_tasks / total_tasks) if total_tasks > 0 else 0
        
        prompt = f"""
Analyze productivity patterns over the last {days} days.

STATISTICS:
- Total tasks: {total_tasks}
- Completed tasks: {completed_tasks}
- Completion rate: {completion_rate:.2%}
- Context entries: {context_entries.count()}

Please provide analysis in the following JSON format:
{{
    "productivity_score": 7.5,
    "patterns": ["pattern1", "pattern2"],
    "trends": ["trend1", "trend2"],
    "recommendations": ["recommendation1", "recommendation2"],
    "strengths": ["strength1", "strength2"],
    "areas_for_improvement": ["area1", "area2"]
}}
"""
        
        try:
            response = self._call_gemini(prompt)
            return self._extract_json_from_response(response)
        except Exception as e:
            print(f"Error analyzing productivity patterns: {e}")
            return {"error": str(e)} 