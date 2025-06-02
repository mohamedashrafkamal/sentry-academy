#!/usr/bin/env bun
import { db, courses, lessons } from "./db/index.ts";
import { eq } from 'drizzle-orm';

// Comprehensive lesson content for AI Observability course
const aiLessonContent = {
  lesson1: `# Introduction to AI Observability

## Overview
AI observability extends traditional application monitoring to address the unique challenges of artificial intelligence and machine learning systems. Unlike conventional software, AI systems involve complex data pipelines, model inference, and unpredictable behaviors that require specialized monitoring approaches.

## Why AI Observability Matters

### Unique Challenges in AI Systems
- **Model Drift**: Performance degradation over time as real-world data diverges from training data
- **Data Quality Issues**: Corrupted, biased, or incomplete input data affecting model accuracy
- **Latency Sensitivity**: Real-time inference requirements with strict performance constraints
- **Resource Intensity**: High computational costs requiring careful resource monitoring
- **Explainability**: Understanding model decisions for compliance and debugging

### Business Impact
- **Revenue Protection**: Prevent model failures that could impact business operations
- **Compliance**: Meet regulatory requirements for AI system transparency
- **Cost Optimization**: Monitor and control expensive GPU and compute resources
- **User Experience**: Ensure consistent, accurate AI-powered features

## Key Components of AI Observability

### 1. Model Performance Monitoring
Track model accuracy, precision, recall, and other performance metrics over time:

\`\`\`python
import sentry_sdk
from sentry_sdk.integrations.logging import LoggingIntegration

# Initialize Sentry for AI monitoring
sentry_sdk.init(
    dsn="YOUR_SENTRY_DSN",
    traces_sample_rate=1.0,
    integrations=[LoggingIntegration()]
)

def monitor_model_performance(model, test_data, predictions):
    with sentry_sdk.start_transaction(name="model_performance_check"):
        accuracy = calculate_accuracy(test_data, predictions)
        precision = calculate_precision(test_data, predictions)
        recall = calculate_recall(test_data, predictions)
        
        # Log metrics to Sentry
        sentry_sdk.set_tag("model_version", model.version)
        sentry_sdk.set_extra("accuracy", accuracy)
        sentry_sdk.set_extra("precision", precision)
        sentry_sdk.set_extra("recall", recall)
        
        # Alert if performance drops below threshold
        if accuracy < 0.85:
            sentry_sdk.capture_message(
                f"Model accuracy dropped to {accuracy}",
                level="warning"
            )
\`\`\`

### 2. Data Pipeline Monitoring
Monitor data quality and pipeline health:

\`\`\`python
def monitor_data_pipeline(data_batch):
    with sentry_sdk.start_transaction(name="data_pipeline_monitoring"):
        # Check data quality metrics
        missing_values = data_batch.isnull().sum().sum()
        duplicate_count = data_batch.duplicated().sum()
        schema_violations = validate_schema(data_batch)
        
        # Log data quality metrics
        sentry_sdk.set_extra("missing_values", missing_values)
        sentry_sdk.set_extra("duplicates", duplicate_count)
        sentry_sdk.set_extra("schema_violations", schema_violations)
        
        # Alert on data quality issues
        if missing_values > 100:
            sentry_sdk.capture_message(
                f"High missing values detected: {missing_values}",
                level="error"
            )
\`\`\`

### 3. Inference Monitoring
Track model inference performance and latency:

\`\`\`python
import time

def monitor_inference(model, input_data):
    with sentry_sdk.start_transaction(name="model_inference") as transaction:
        start_time = time.time()
        
        try:
            prediction = model.predict(input_data)
            inference_time = time.time() - start_time
            
            # Log inference metrics
            transaction.set_data("inference_time_ms", inference_time * 1000)
            transaction.set_data("input_shape", input_data.shape)
            transaction.set_data("prediction_confidence", prediction.max())
            
            # Alert on slow inference
            if inference_time > 0.5:  # 500ms threshold
                sentry_sdk.capture_message(
                    f"Slow inference detected: {inference_time}s",
                    level="warning"
                )
                
            return prediction
            
        except Exception as e:
            sentry_sdk.capture_exception(e)
            raise
\`\`\`

## AI Observability Architecture

### Multi-Layer Monitoring Approach
1. **Infrastructure Layer**: GPU utilization, memory usage, network I/O
2. **Data Layer**: Data quality, pipeline health, feature drift
3. **Model Layer**: Performance metrics, inference latency, prediction distribution
4. **Application Layer**: User interactions, business metrics, error rates

### Real-Time vs Batch Monitoring
- **Real-Time**: Inference latency, error rates, resource utilization
- **Batch**: Model accuracy, data drift analysis, comprehensive performance reports

## Metrics and KPIs for AI Systems

### Technical Metrics
- **Accuracy/F1 Score**: Model prediction quality
- **Inference Latency**: Time to generate predictions
- **Throughput**: Predictions per second
- **Resource Utilization**: GPU/CPU usage, memory consumption
- **Error Rate**: Failed predictions or system errors

### Business Metrics
- **Model ROI**: Business value generated by AI predictions
- **User Satisfaction**: Feedback on AI-powered features
- **Conversion Impact**: Effect of AI on business conversions
- **Cost per Prediction**: Operational costs for AI inference

## Common AI Observability Patterns

### 1. A/B Testing with Models
\`\`\`python
def ab_test_models(user_id, input_data):
    model_variant = "A" if hash(user_id) % 2 == 0 else "B"
    
    with sentry_sdk.start_transaction(name="ab_test_prediction") as transaction:
        transaction.set_tag("model_variant", model_variant)
        
        if model_variant == "A":
            prediction = model_a.predict(input_data)
        else:
            prediction = model_b.predict(input_data)
            
        transaction.set_data("prediction", prediction)
        return prediction
\`\`\`

### 2. Feature Store Monitoring
\`\`\`python
def monitor_feature_store(feature_name, feature_values):
    with sentry_sdk.start_transaction(name="feature_store_monitoring"):
        # Check feature distribution
        mean_value = np.mean(feature_values)
        std_value = np.std(feature_values)
        
        # Compare with historical baselines
        if abs(mean_value - historical_mean) > 2 * historical_std:
            sentry_sdk.capture_message(
                f"Feature drift detected in {feature_name}",
                level="warning"
            )
\`\`\`

### 3. Model Rollback Strategy
\`\`\`python
def safe_model_deployment():
    current_accuracy = monitor_model_performance(new_model, validation_data)
    baseline_accuracy = get_baseline_accuracy()
    
    if current_accuracy < baseline_accuracy - 0.05:  # 5% threshold
        sentry_sdk.capture_message(
            "Model performance regression detected, initiating rollback",
            level="error"
        )
        rollback_to_previous_model()
\`\`\`

## Best Practices for AI Observability

### 1. Establish Baselines Early
- Collect comprehensive metrics during model development
- Document expected performance ranges
- Set up automated alerts for deviations

### 2. Monitor the Full ML Pipeline
- Data ingestion and preprocessing
- Feature engineering and selection
- Model training and validation
- Inference and serving
- Post-processing and delivery

### 3. Implement Gradual Rollouts
- Deploy new models to small traffic percentages
- Monitor performance before full deployment
- Maintain rollback capabilities

### 4. Focus on Business Impact
- Connect technical metrics to business outcomes
- Monitor user satisfaction and engagement
- Track revenue impact of AI features

## Tools and Technologies

### Open Source Solutions
- **MLflow**: Model lifecycle management and tracking
- **Kubeflow**: Kubernetes-native ML workflows
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization and dashboards

### Commercial Platforms
- **Sentry**: Error tracking and performance monitoring for AI apps
- **DataDog**: Infrastructure and application monitoring
- **New Relic**: Full-stack observability with AI insights
- **Weights & Biases**: Experiment tracking and model monitoring

## Next Steps

In the following lessons, we'll explore:
- Setting up comprehensive model monitoring dashboards
- Implementing automated data quality checks
- Building alerting systems for AI applications
- Measuring and optimizing AI system costs

Understanding these fundamentals will enable you to build robust, observable AI systems that maintain high performance and reliability in production environments.`,

  lesson2: `# Model Performance Monitoring

## Understanding Model Performance in Production

Model performance monitoring goes beyond traditional application metrics to include AI-specific indicators that determine whether your models are delivering accurate, reliable predictions in real-world scenarios.

## Core Performance Metrics

### Classification Metrics

#### Accuracy and Beyond
\`\`\`python
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import sentry_sdk

def comprehensive_classification_monitoring(y_true, y_pred, model_version):
    with sentry_sdk.start_transaction(name="classification_monitoring") as transaction:
        # Calculate core metrics
        accuracy = accuracy_score(y_true, y_pred)
        precision = precision_score(y_true, y_pred, average='weighted')
        recall = recall_score(y_true, y_pred, average='weighted')
        f1 = f1_score(y_true, y_pred, average='weighted')
        
        # Log metrics with context
        transaction.set_data("model_version", model_version)
        transaction.set_data("accuracy", accuracy)
        transaction.set_data("precision", precision)
        transaction.set_data("recall", recall)
        transaction.set_data("f1_score", f1)
        transaction.set_data("sample_size", len(y_true))
        
        # Performance thresholds
        if accuracy < 0.85:
            sentry_sdk.capture_message(
                f"Model accuracy below threshold: {accuracy:.3f}",
                level="warning",
                extra={
                    "model_version": model_version,
                    "metric": "accuracy",
                    "value": accuracy,
                    "threshold": 0.85
                }
            )
        
        return {
            "accuracy": accuracy,
            "precision": precision,
            "recall": recall,
            "f1_score": f1
        }
\`\`\`

#### Confusion Matrix Monitoring
\`\`\`python
from sklearn.metrics import confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

def monitor_confusion_matrix(y_true, y_pred, class_names):
    cm = confusion_matrix(y_true, y_pred)
    
    # Calculate per-class performance
    class_performance = {}
    for i, class_name in enumerate(class_names):
        tp = cm[i, i]
        fp = cm[:, i].sum() - tp
        fn = cm[i, :].sum() - tp
        tn = cm.sum() - tp - fp - fn
        
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        
        class_performance[class_name] = {
            "precision": precision,
            "recall": recall,
            "support": cm[i, :].sum()
        }
        
        # Alert on poor class performance
        if precision < 0.7 and cm[i, :].sum() > 10:  # Only alert for classes with sufficient samples
            sentry_sdk.capture_message(
                f"Poor precision for class {class_name}: {precision:.3f}",
                level="warning",
                extra={
                    "class_name": class_name,
                    "precision": precision,
                    "recall": recall,
                    "support": cm[i, :].sum()
                }
            )
    
    return class_performance
\`\`\`

### Regression Metrics

#### Comprehensive Regression Monitoring
\`\`\`python
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

def monitor_regression_performance(y_true, y_pred, model_version):
    with sentry_sdk.start_transaction(name="regression_monitoring") as transaction:
        # Calculate regression metrics
        mse = mean_squared_error(y_true, y_pred)
        rmse = np.sqrt(mse)
        mae = mean_absolute_error(y_true, y_pred)
        r2 = r2_score(y_true, y_pred)
        
        # Calculate residuals statistics
        residuals = y_true - y_pred
        residual_std = np.std(residuals)
        residual_mean = np.mean(residuals)
        
        # Log comprehensive metrics
        transaction.set_data("model_version", model_version)
        transaction.set_data("rmse", rmse)
        transaction.set_data("mae", mae)
        transaction.set_data("r2_score", r2)
        transaction.set_data("residual_std", residual_std)
        transaction.set_data("residual_mean", residual_mean)
        
        # Performance alerts
        if r2 < 0.8:  # R² threshold
            sentry_sdk.capture_message(
                f"Low R² score detected: {r2:.3f}",
                level="warning",
                extra={
                    "model_version": model_version,
                    "r2_score": r2,
                    "rmse": rmse,
                    "mae": mae
                }
            )
        
        # Check for systematic bias
        if abs(residual_mean) > 0.1 * np.std(y_true):
            sentry_sdk.capture_message(
                f"Systematic bias detected: mean residual = {residual_mean:.3f}",
                level="warning",
                extra={
                    "model_version": model_version,
                    "residual_mean": residual_mean,
                    "residual_std": residual_std
                }
            )
        
        return {
            "rmse": rmse,
            "mae": mae,
            "r2_score": r2,
            "residual_stats": {
                "mean": residual_mean,
                "std": residual_std
            }
        }
\`\`\`

## Model Drift Detection

### Data Drift Monitoring
\`\`\`python
from scipy import stats
import pandas as pd

def detect_feature_drift(reference_data, current_data, feature_columns):
    drift_results = {}
    
    for feature in feature_columns:
        if feature in reference_data.columns and feature in current_data.columns:
            # Kolmogorov-Smirnov test for distribution drift
            ks_statistic, p_value = stats.ks_2samp(
                reference_data[feature].dropna(),
                current_data[feature].dropna()
            )
            
            # Population Stability Index (PSI)
            psi = calculate_psi(reference_data[feature], current_data[feature])
            
            drift_results[feature] = {
                "ks_statistic": ks_statistic,
                "p_value": p_value,
                "psi": psi,
                "drift_detected": p_value < 0.05 or psi > 0.2
            }
            
            # Alert on significant drift
            if drift_results[feature]["drift_detected"]:
                sentry_sdk.capture_message(
                    f"Feature drift detected in {feature}",
                    level="warning",
                    extra={
                        "feature": feature,
                        "ks_statistic": ks_statistic,
                        "p_value": p_value,
                        "psi": psi
                    }
                )
    
    return drift_results

def calculate_psi(reference, current, bins=10):
    """Calculate Population Stability Index"""
    # Create bins based on reference data
    _, bin_edges = pd.cut(reference, bins=bins, retbins=True, duplicates='drop')
    
    # Calculate distributions
    ref_dist = pd.cut(reference, bins=bin_edges, include_lowest=True).value_counts().sort_index()
    cur_dist = pd.cut(current, bins=bin_edges, include_lowest=True).value_counts().sort_index()
    
    # Normalize to percentages
    ref_pct = ref_dist / len(reference)
    cur_pct = cur_dist / len(current)
    
    # Calculate PSI
    psi = sum((cur_pct - ref_pct) * np.log(cur_pct / ref_pct.replace(0, 0.0001)))
    return psi
\`\`\`

### Concept Drift Monitoring
\`\`\`python
def monitor_concept_drift(model, reference_X, reference_y, current_X, current_y):
    """Monitor for concept drift using model performance comparison"""
    
    with sentry_sdk.start_transaction(name="concept_drift_monitoring") as transaction:
        # Performance on reference data
        ref_predictions = model.predict(reference_X)
        ref_accuracy = accuracy_score(reference_y, ref_predictions)
        
        # Performance on current data
        cur_predictions = model.predict(current_X)
        cur_accuracy = accuracy_score(current_y, cur_predictions)
        
        # Calculate performance degradation
        performance_drop = ref_accuracy - cur_accuracy
        performance_drop_pct = (performance_drop / ref_accuracy) * 100
        
        transaction.set_data("reference_accuracy", ref_accuracy)
        transaction.set_data("current_accuracy", cur_accuracy)
        transaction.set_data("performance_drop", performance_drop)
        transaction.set_data("performance_drop_pct", performance_drop_pct)
        
        # Alert on significant concept drift
        if performance_drop_pct > 10:  # 10% performance drop threshold
            sentry_sdk.capture_message(
                f"Concept drift detected: {performance_drop_pct:.1f}% performance drop",
                level="error",
                extra={
                    "reference_accuracy": ref_accuracy,
                    "current_accuracy": cur_accuracy,
                    "performance_drop_pct": performance_drop_pct,
                    "reference_samples": len(reference_X),
                    "current_samples": len(current_X)
                }
            )
        
        return {
            "reference_accuracy": ref_accuracy,
            "current_accuracy": cur_accuracy,
            "performance_drop_pct": performance_drop_pct,
            "drift_detected": performance_drop_pct > 10
        }
\`\`\`

## Real-Time Performance Tracking

### Inference Performance Monitoring
\`\`\`python
import time
from collections import deque
from threading import Lock

class InferenceMonitor:
    def __init__(self, window_size=1000):
        self.window_size = window_size
        self.latencies = deque(maxlen=window_size)
        self.predictions = deque(maxlen=window_size)
        self.confidence_scores = deque(maxlen=window_size)
        self.lock = Lock()
    
    def record_inference(self, latency, prediction, confidence=None):
        with self.lock:
            self.latencies.append(latency)
            self.predictions.append(prediction)
            if confidence is not None:
                self.confidence_scores.append(confidence)
            
            # Check for performance issues every 100 inferences
            if len(self.latencies) % 100 == 0:
                self._check_performance_alerts()
    
    def _check_performance_alerts(self):
        if len(self.latencies) < 50:  # Need minimum samples
            return
        
        # Calculate performance metrics
        avg_latency = np.mean(list(self.latencies))
        p95_latency = np.percentile(list(self.latencies), 95)
        avg_confidence = np.mean(list(self.confidence_scores)) if self.confidence_scores else None
        
        # Latency alerts
        if avg_latency > 500:  # 500ms threshold
            sentry_sdk.capture_message(
                f"High average inference latency: {avg_latency:.1f}ms",
                level="warning",
                extra={
                    "avg_latency_ms": avg_latency,
                    "p95_latency_ms": p95_latency,
                    "sample_count": len(self.latencies)
                }
            )
        
        # Confidence alerts
        if avg_confidence and avg_confidence < 0.7:
            sentry_sdk.capture_message(
                f"Low prediction confidence: {avg_confidence:.3f}",
                level="warning",
                extra={
                    "avg_confidence": avg_confidence,
                    "sample_count": len(self.confidence_scores)
                }
            )

# Usage example
monitor = InferenceMonitor()

def monitored_prediction(model, input_data):
    start_time = time.time()
    
    with sentry_sdk.start_transaction(name="model_prediction") as transaction:
        try:
            prediction = model.predict(input_data)
            confidence = getattr(model, 'predict_proba', lambda x: None)(input_data)
            
            latency = (time.time() - start_time) * 1000  # Convert to ms
            
            # Record metrics
            monitor.record_inference(
                latency=latency,
                prediction=prediction,
                confidence=confidence.max() if confidence is not None else None
            )
            
            transaction.set_data("latency_ms", latency)
            transaction.set_data("prediction", prediction)
            if confidence is not None:
                transaction.set_data("confidence", confidence.max())
            
            return prediction
            
        except Exception as e:
            sentry_sdk.capture_exception(e)
            raise
\`\`\`

## Performance Benchmarking

### A/B Testing Framework
\`\`\`python
class ModelABTesting:
    def __init__(self, model_a, model_b, traffic_split=0.5):
        self.model_a = model_a
        self.model_b = model_b
        self.traffic_split = traffic_split
        self.results = {"A": [], "B": []}
    
    def predict(self, user_id, input_data, ground_truth=None):
        # Determine model variant
        variant = "A" if hash(str(user_id)) % 100 < (self.traffic_split * 100) else "B"
        model = self.model_a if variant == "A" else self.model_b
        
        with sentry_sdk.start_transaction(name="ab_test_prediction") as transaction:
            transaction.set_tag("model_variant", variant)
            transaction.set_tag("user_id", str(user_id))
            
            start_time = time.time()
            prediction = model.predict(input_data)
            latency = (time.time() - start_time) * 1000
            
            # Record results
            result = {
                "prediction": prediction,
                "latency": latency,
                "timestamp": time.time()
            }
            
            if ground_truth is not None:
                result["accuracy"] = (prediction == ground_truth)
            
            self.results[variant].append(result)
            
            transaction.set_data("prediction", prediction)
            transaction.set_data("latency_ms", latency)
            
            # Periodic performance comparison
            if len(self.results["A"]) % 1000 == 0 and len(self.results["B"]) % 1000 == 0:
                self._compare_variants()
            
            return prediction
    
    def _compare_variants(self):
        """Compare performance between model variants"""
        if len(self.results["A"]) < 100 or len(self.results["B"]) < 100:
            return
        
        # Calculate metrics for each variant
        for variant in ["A", "B"]:
            results = self.results[variant]
            avg_latency = np.mean([r["latency"] for r in results[-1000:]])  # Last 1000 samples
            
            if "accuracy" in results[0]:  # If ground truth available
                accuracy = np.mean([r["accuracy"] for r in results[-1000:]])
                sentry_sdk.set_extra(f"variant_{variant}_accuracy", accuracy)
            
            sentry_sdk.set_extra(f"variant_{variant}_latency", avg_latency)
        
        # Log comparison
        sentry_sdk.capture_message(
            "A/B test performance comparison updated",
            level="info",
            extra={
                "variant_a_samples": len(self.results["A"]),
                "variant_b_samples": len(self.results["B"])
            }
        )
\`\`\`

## Dashboard and Alerting Setup

### Custom Metrics Dashboard
\`\`\`python
def create_performance_dashboard():
    """Example of key metrics to track in dashboards"""
    dashboard_metrics = {
        "model_performance": {
            "accuracy": "Current model accuracy",
            "precision": "Weighted precision score",
            "recall": "Weighted recall score",
            "f1_score": "F1 score"
        },
        "operational_metrics": {
            "inference_latency_p50": "50th percentile inference time",
            "inference_latency_p95": "95th percentile inference time",
            "throughput": "Predictions per second",
            "error_rate": "Percentage of failed predictions"
        },
        "data_quality": {
            "missing_values_pct": "Percentage of missing values",
            "schema_violations": "Number of schema validation errors",
            "feature_drift_score": "Average drift score across features"
        },
        "business_impact": {
            "conversion_rate": "Business conversion rate",
            "revenue_impact": "Revenue attributed to model predictions",
            "user_satisfaction": "User feedback scores"
        }
    }
    
    return dashboard_metrics
\`\`\`

## Best Practices for Model Performance Monitoring

### 1. Establish Performance Baselines
- Record comprehensive metrics during model validation
- Set realistic performance thresholds based on business requirements
- Document acceptable performance ranges

### 2. Monitor Continuously
- Implement real-time performance tracking
- Set up automated alerts for performance degradation
- Regular batch analysis for deeper insights

### 3. Context-Aware Monitoring
- Segment performance by user groups, time periods, and data sources
- Monitor performance across different input distributions
- Track performance for edge cases and rare events

### 4. Automated Response
- Implement automatic rollback for severe performance drops
- Set up escalation procedures for different alert levels
- Maintain model versioning and deployment history

In the next lesson, we'll explore data quality monitoring and pipeline observability to ensure your AI systems receive clean, reliable data for optimal performance.`,

  lesson3: `# Data Quality and Pipeline Monitoring

## Introduction to Data Quality in AI Systems

Data quality is the foundation of reliable AI systems. Poor data quality can lead to model drift, biased predictions, and system failures. This lesson covers comprehensive strategies for monitoring data quality and pipeline health in production AI environments.

## Understanding Data Quality Dimensions

### Core Data Quality Metrics

#### Completeness
\`\`\`python
import pandas as pd
import numpy as np
import sentry_sdk
from typing import Dict, List, Optional

def monitor_data_completeness(df: pd.DataFrame, required_columns: List[str]) -> Dict:
    """Monitor data completeness across critical columns"""
    
    with sentry_sdk.start_transaction(name="data_completeness_check") as transaction:
        completeness_report = {}
        
        for column in required_columns:
            if column in df.columns:
                total_rows = len(df)
                missing_count = df[column].isna().sum()
                completeness_pct = ((total_rows - missing_count) / total_rows) * 100
                
                completeness_report[column] = {
                    "total_rows": total_rows,
                    "missing_count": missing_count,
                    "completeness_pct": completeness_pct
                }
                
                # Alert on low completeness
                if completeness_pct < 95:  # 95% completeness threshold
                    sentry_sdk.capture_message(
                        f"Low data completeness in column {column}: {completeness_pct:.1f}%",
                        level="warning",
                        extra={
                            "column": column,
                            "completeness_pct": completeness_pct,
                            "missing_count": missing_count,
                            "total_rows": total_rows
                        }
                    )
        
        # Overall completeness score
        overall_completeness = np.mean([
            report["completeness_pct"] for report in completeness_report.values()
        ])
        
        transaction.set_data("overall_completeness", overall_completeness)
        transaction.set_data("columns_checked", len(required_columns))
        
        return completeness_report
\`\`\`

#### Accuracy and Validity
\`\`\`python
def monitor_data_validity(df: pd.DataFrame, validation_rules: Dict) -> Dict:
    """Monitor data validity using custom validation rules"""
    
    with sentry_sdk.start_transaction(name="data_validity_check") as transaction:
        validity_report = {}
        
        for column, rules in validation_rules.items():
            if column not in df.columns:
                continue
                
            column_data = df[column].dropna()
            valid_count = len(column_data)
            invalid_count = 0
            
            # Range validation
            if 'min_value' in rules:
                invalid_count += (column_data < rules['min_value']).sum()
            if 'max_value' in rules:
                invalid_count += (column_data > rules['max_value']).sum()
            
            # Pattern validation (for strings)
            if 'pattern' in rules and column_data.dtype == 'object':
                import re
                pattern_invalid = ~column_data.str.match(rules['pattern'], na=False)
                invalid_count += pattern_invalid.sum()
            
            # Categorical validation
            if 'allowed_values' in rules:
                invalid_count += (~column_data.isin(rules['allowed_values'])).sum()
            
            validity_pct = ((valid_count - invalid_count) / valid_count) * 100 if valid_count > 0 else 0
            
            validity_report[column] = {
                "valid_count": valid_count - invalid_count,
                "invalid_count": invalid_count,
                "validity_pct": validity_pct
            }
            
            # Alert on low validity
            if validity_pct < 98:  # 98% validity threshold
                sentry_sdk.capture_message(
                    f"Data validity issues in column {column}: {validity_pct:.1f}%",
                    level="error",
                    extra={
                        "column": column,
                        "validity_pct": validity_pct,
                        "invalid_count": invalid_count,
                        "validation_rules": rules
                    }
                )
        
        return validity_report

# Example validation rules
validation_rules = {
    "age": {"min_value": 0, "max_value": 120},
    "email": {"pattern": r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"},
    "category": {"allowed_values": ["A", "B", "C", "D"]},
    "score": {"min_value": 0.0, "max_value": 1.0}
}
\`\`\`

#### Consistency
\`\`\`python
def monitor_data_consistency(df: pd.DataFrame, consistency_rules: Dict) -> Dict:
    """Monitor data consistency across related columns"""
    
    with sentry_sdk.start_transaction(name="data_consistency_check") as transaction:
        consistency_report = {}
        
        for rule_name, rule_config in consistency_rules.items():
            if rule_config['type'] == 'relationship':
                col1, col2 = rule_config['columns']
                operator = rule_config['operator']
                
                if col1 in df.columns and col2 in df.columns:
                    valid_data = df[[col1, col2]].dropna()
                    
                    if operator == 'greater_than':
                        violations = (valid_data[col1] <= valid_data[col2]).sum()
                    elif operator == 'less_than':
                        violations = (valid_data[col1] >= valid_data[col2]).sum()
                    elif operator == 'equal':
                        violations = (valid_data[col1] != valid_data[col2]).sum()
                    
                    consistency_pct = ((len(valid_data) - violations) / len(valid_data)) * 100 if len(valid_data) > 0 else 0
                    
                    consistency_report[rule_name] = {
                        "total_checked": len(valid_data),
                        "violations": violations,
                        "consistency_pct": consistency_pct
                    }
                    
                    # Alert on consistency violations
                    if consistency_pct < 99:  # 99% consistency threshold
                        sentry_sdk.capture_message(
                            f"Data consistency violation in rule {rule_name}: {consistency_pct:.1f}%",
                            level="warning",
                            extra={
                                "rule_name": rule_name,
                                "consistency_pct": consistency_pct,
                                "violations": violations,
                                "rule_config": rule_config
                            }
                        )
        
        return consistency_report

# Example consistency rules
consistency_rules = {
    "start_end_date": {
        "type": "relationship",
        "columns": ["start_date", "end_date"],
        "operator": "less_than"
    },
    "min_max_values": {
        "type": "relationship", 
        "columns": ["min_value", "max_value"],
        "operator": "less_than"
    }
}
\`\`\`

## Pipeline Health Monitoring

### Data Pipeline Stages
\`\`\`python
from datetime import datetime, timedelta
import time

class PipelineStageMonitor:
    def __init__(self, stage_name: str):
        self.stage_name = stage_name
        self.start_time = None
        self.transaction = None
    
    def __enter__(self):
        self.start_time = time.time()
        self.transaction = sentry_sdk.start_transaction(
            name=f"pipeline_stage_{self.stage_name}"
        )
        self.transaction.set_tag("stage_name", self.stage_name)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = time.time() - self.start_time
        
        if exc_type is None:
            # Success
            self.transaction.set_data("duration_seconds", duration)
            self.transaction.set_data("status", "success")
            
            # Check for performance issues
            if duration > 300:  # 5 minutes threshold
                sentry_sdk.capture_message(
                    f"Slow pipeline stage: {self.stage_name} took {duration:.1f}s",
                    level="warning",
                    extra={
                        "stage_name": self.stage_name,
                        "duration_seconds": duration
                    }
                )
        else:
            # Failure
            self.transaction.set_data("status", "error")
            sentry_sdk.capture_exception(exc_val)
        
        self.transaction.finish()

# Usage example
def data_ingestion_pipeline():
    with PipelineStageMonitor("data_extraction"):
        raw_data = extract_data_from_source()
    
    with PipelineStageMonitor("data_transformation"):
        cleaned_data = transform_data(raw_data)
    
    with PipelineStageMonitor("data_validation"):
        validated_data = validate_data(cleaned_data)
    
    with PipelineStageMonitor("data_loading"):
        load_data_to_destination(validated_data)
\`\`\`

### Real-time Data Quality Monitoring
\`\`\`python
class RealTimeDataQualityMonitor:
    def __init__(self, alert_thresholds: Dict):
        self.alert_thresholds = alert_thresholds
        self.recent_metrics = {}
    
    def process_batch(self, batch_data: pd.DataFrame, batch_id: str):
        """Process a data batch and monitor quality metrics"""
        
        with sentry_sdk.start_transaction(name="batch_quality_monitoring") as transaction:
            transaction.set_tag("batch_id", batch_id)
            transaction.set_data("batch_size", len(batch_data))
            
            # Calculate quality metrics
            quality_metrics = self._calculate_quality_metrics(batch_data)
            
            # Store metrics for trend analysis
            self.recent_metrics[batch_id] = {
                "timestamp": datetime.now(),
                "metrics": quality_metrics
            }
            
            # Check for alerts
            self._check_quality_alerts(quality_metrics, batch_id)
            
            # Log metrics
            for metric_name, value in quality_metrics.items():
                transaction.set_data(metric_name, value)
            
            return quality_metrics
    
    def _calculate_quality_metrics(self, df: pd.DataFrame) -> Dict:
        """Calculate comprehensive quality metrics for a batch"""
        metrics = {}
        
        # Completeness
        metrics['completeness_pct'] = (1 - df.isna().sum().sum() / (len(df) * len(df.columns))) * 100
        
        # Uniqueness (for ID columns)
        if 'id' in df.columns:
            metrics['uniqueness_pct'] = (df['id'].nunique() / len(df)) * 100
        
        # Consistency (data type adherence)
        numeric_columns = df.select_dtypes(include=[np.number]).columns
        if len(numeric_columns) > 0:
            metrics['numeric_consistency_pct'] = 100  # Assume consistent if selected correctly
        
        # Timeliness (if timestamp column exists)
        if 'timestamp' in df.columns:
            latest_timestamp = pd.to_datetime(df['timestamp']).max()
            time_lag = (datetime.now() - latest_timestamp).total_seconds() / 3600  # hours
            metrics['data_freshness_hours'] = time_lag
        
        # Volume
        metrics['record_count'] = len(df)
        
        return metrics
    
    def _check_quality_alerts(self, metrics: Dict, batch_id: str):
        """Check metrics against thresholds and send alerts"""
        
        for metric_name, value in metrics.items():
            if metric_name in self.alert_thresholds:
                threshold = self.alert_thresholds[metric_name]
                
                if metric_name.endswith('_pct') and value < threshold['min']:
                    sentry_sdk.capture_message(
                        f"Data quality alert: {metric_name} below threshold",
                        level="error",
                        extra={
                            "metric_name": metric_name,
                            "current_value": value,
                            "threshold": threshold['min'],
                            "batch_id": batch_id
                        }
                    )
                elif metric_name == 'data_freshness_hours' and value > threshold['max']:
                    sentry_sdk.capture_message(
                        f"Data freshness alert: data is {value:.1f} hours old",
                        level="warning",
                        extra={
                            "metric_name": metric_name,
                            "current_value": value,
                            "threshold": threshold['max'],
                            "batch_id": batch_id
                        }
                    )

# Configuration example
alert_thresholds = {
    'completeness_pct': {'min': 95.0},
    'uniqueness_pct': {'min': 99.0},
    'data_freshness_hours': {'max': 2.0}
}

monitor = RealTimeDataQualityMonitor(alert_thresholds)
\`\`\`

## Feature Store Monitoring

### Feature Drift Detection
\`\`\`python
from scipy import stats
from sklearn.preprocessing import StandardScaler

class FeatureDriftMonitor:
    def __init__(self, reference_data: pd.DataFrame, feature_columns: List[str]):
        self.reference_data = reference_data[feature_columns]
        self.feature_columns = feature_columns
        self.scaler = StandardScaler()
        self.reference_stats = self._calculate_reference_stats()
    
    def _calculate_reference_stats(self) -> Dict:
        """Calculate reference statistics for drift detection"""
        stats = {}
        for column in self.feature_columns:
            if column in self.reference_data.columns:
                data = self.reference_data[column].dropna()
                stats[column] = {
                    'mean': data.mean(),
                    'std': data.std(),
                    'min': data.min(),
                    'max': data.max(),
                    'q25': data.quantile(0.25),
                    'q50': data.quantile(0.50),
                    'q75': data.quantile(0.75)
                }
        return stats
    
    def detect_drift(self, current_data: pd.DataFrame) -> Dict:
        """Detect feature drift between reference and current data"""
        
        with sentry_sdk.start_transaction(name="feature_drift_detection") as transaction:
            drift_results = {}
            
            for column in self.feature_columns:
                if column not in current_data.columns:
                    continue
                
                reference_values = self.reference_data[column].dropna()
                current_values = current_data[column].dropna()
                
                if len(current_values) < 100:  # Need sufficient samples
                    continue
                
                # Statistical tests
                drift_metrics = self._calculate_drift_metrics(
                    reference_values, current_values, column
                )
                
                drift_results[column] = drift_metrics
                
                # Alert on significant drift
                if drift_metrics['drift_detected']:
                    sentry_sdk.capture_message(
                        f"Feature drift detected in {column}",
                        level="warning",
                        extra={
                            "feature": column,
                            "drift_score": drift_metrics['drift_score'],
                            "ks_pvalue": drift_metrics['ks_pvalue'],
                            "mean_shift": drift_metrics['mean_shift'],
                            "std_shift": drift_metrics['std_shift']
                        }
                    )
            
            # Overall drift score
            overall_drift_score = np.mean([
                result['drift_score'] for result in drift_results.values()
            ])
            
            transaction.set_data("overall_drift_score", overall_drift_score)
            transaction.set_data("features_checked", len(drift_results))
            
            return drift_results
    
    def _calculate_drift_metrics(self, reference: pd.Series, current: pd.Series, column: str) -> Dict:
        """Calculate comprehensive drift metrics for a feature"""
        
        # Kolmogorov-Smirnov test
        ks_statistic, ks_pvalue = stats.ks_2samp(reference, current)
        
        # Population Stability Index (PSI)
        psi = self._calculate_psi(reference, current)
        
        # Statistical differences
        ref_stats = self.reference_stats[column]
        curr_mean = current.mean()
        curr_std = current.std()
        
        mean_shift = abs(curr_mean - ref_stats['mean']) / ref_stats['std']
        std_shift = abs(curr_std - ref_stats['std']) / ref_stats['std']
        
        # Combine metrics into drift score
        drift_score = (ks_statistic + psi + min(mean_shift, 3) + min(std_shift, 3)) / 4
        
        # Determine if drift is significant
        drift_detected = (
            ks_pvalue < 0.05 or  # Significant distribution change
            psi > 0.2 or         # High PSI
            mean_shift > 2 or    # Large mean shift (2 standard deviations)
            std_shift > 0.5      # Large variance change
        )
        
        return {
            'drift_score': drift_score,
            'ks_statistic': ks_statistic,
            'ks_pvalue': ks_pvalue,
            'psi': psi,
            'mean_shift': mean_shift,
            'std_shift': std_shift,
            'drift_detected': drift_detected,
            'current_mean': curr_mean,
            'current_std': curr_std,
            'reference_mean': ref_stats['mean'],
            'reference_std': ref_stats['std']
        }
    
    def _calculate_psi(self, reference: pd.Series, current: pd.Series, bins=10) -> float:
        """Calculate Population Stability Index"""
        try:
            # Create bins based on reference data
            _, bin_edges = pd.cut(reference, bins=bins, retbins=True, duplicates='drop')
            
            # Calculate distributions
            ref_dist = pd.cut(reference, bins=bin_edges, include_lowest=True).value_counts().sort_index()
            cur_dist = pd.cut(current, bins=bin_edges, include_lowest=True).value_counts().sort_index()
            
            # Normalize to percentages and avoid division by zero
            ref_pct = ref_dist / len(reference)
            cur_pct = cur_dist / len(current)
            
            # Replace zeros with small value to avoid log(0)
            ref_pct = ref_pct.replace(0, 0.0001)
            cur_pct = cur_pct.replace(0, 0.0001)
            
            # Calculate PSI
            psi = sum((cur_pct - ref_pct) * np.log(cur_pct / ref_pct))
            return float(psi)
        
        except Exception as e:
            sentry_sdk.capture_exception(e)
            return 0.0  # Return 0 if calculation fails
\`\`\`

## Data Lineage and Provenance Tracking

### Data Lineage Monitoring
\`\`\`python
class DataLineageTracker:
    def __init__(self):
        self.lineage_graph = {}
    
    def track_transformation(self, 
                           source_dataset: str, 
                           target_dataset: str, 
                           transformation_type: str,
                           metadata: Dict = None):
        """Track data transformations for lineage"""
        
        lineage_entry = {
            "source": source_dataset,
            "target": target_dataset,
            "transformation": transformation_type,
            "timestamp": datetime.now().isoformat(),
            "metadata": metadata or {}
        }
        
        # Log to Sentry for audit trail
        sentry_sdk.capture_message(
            f"Data transformation: {source_dataset} → {target_dataset}",
            level="info",
            extra=lineage_entry
        )
        
        # Store in lineage graph
        if target_dataset not in self.lineage_graph:
            self.lineage_graph[target_dataset] = []
        
        self.lineage_graph[target_dataset].append(lineage_entry)
    
    def get_data_lineage(self, dataset: str) -> List[Dict]:
        """Get complete lineage for a dataset"""
        return self.lineage_graph.get(dataset, [])
    
    def validate_data_freshness(self, dataset: str, max_age_hours: int = 24):
        """Validate that data is fresh enough for use"""
        lineage = self.get_data_lineage(dataset)
        
        if not lineage:
            sentry_sdk.capture_message(
                f"No lineage found for dataset {dataset}",
                level="warning",
                extra={"dataset": dataset}
            )
            return False
        
        latest_update = max([
            datetime.fromisoformat(entry["timestamp"]) 
            for entry in lineage
        ])
        
        age_hours = (datetime.now() - latest_update).total_seconds() / 3600
        
        if age_hours > max_age_hours:
            sentry_sdk.capture_message(
                f"Stale data detected: {dataset} is {age_hours:.1f} hours old",
                level="error",
                extra={
                    "dataset": dataset,
                    "age_hours": age_hours,
                    "max_age_hours": max_age_hours,
                    "last_update": latest_update.isoformat()
                }
            )
            return False
        
        return True

# Usage example
lineage_tracker = DataLineageTracker()

def process_user_data():
    # Track data movement through pipeline
    lineage_tracker.track_transformation(
        source_dataset="raw_user_events",
        target_dataset="cleaned_user_events", 
        transformation_type="data_cleaning",
        metadata={"records_processed": 10000, "cleaning_rules": ["remove_duplicates", "validate_timestamps"]}
    )
    
    lineage_tracker.track_transformation(
        source_dataset="cleaned_user_events",
        target_dataset="user_features",
        transformation_type="feature_engineering",
        metadata={"features_created": ["session_duration", "page_views", "bounce_rate"]}
    )
\`\`\`

## Best Practices for Data Quality Monitoring

### 1. Establish Data Quality SLAs
- Define acceptable ranges for completeness, accuracy, and freshness
- Set up automated monitoring for critical data quality metrics
- Implement escalation procedures for data quality violations

### 2. Proactive Monitoring
- Monitor data quality at ingestion, transformation, and consumption points
- Implement real-time alerts for critical data quality issues
- Regular batch analysis for trend detection

### 3. Data Validation Gates
- Implement validation checkpoints in data pipelines
- Fail fast on critical data quality violations
- Maintain data quality history for trend analysis

### 4. Collaborative Data Quality
- Involve data producers in quality monitoring
- Provide feedback loops for data quality improvements
- Share data quality metrics across teams

### 5. Continuous Improvement
- Regular review of data quality thresholds
- Update validation rules based on evolving data patterns
- Invest in data quality tooling and automation

This comprehensive approach to data quality and pipeline monitoring ensures that your AI systems receive reliable, high-quality data, enabling consistent model performance and reliable predictions in production environments.`
};

async function populateAICourseContent() {
  try {
    console.log('🤖 Populating AI Observability course content...');
    
    // Find the AI course
    const aiCourse = await db
      .select()
      .from(courses)
      .where(eq(courses.title, 'Observability for AI applications'))
      .limit(1);
    
    if (aiCourse.length === 0) {
      console.error('❌ AI Observability course not found');
      return;
    }
    
    const courseId = aiCourse[0].id;
    console.log(`Found course: ${aiCourse[0].title} (ID: ${courseId})`);
    
    // Get existing lessons
    const existingLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId));
    
    console.log(`Found ${existingLessons.length} existing lessons`);
    
    // Update lessons with rich content
    const lessonUpdates = [
      {
        title: 'Introduction to AI Observability',
        content: aiLessonContent.lesson1
      },
      {
        title: 'Model Performance Monitoring', 
        content: aiLessonContent.lesson2
      },
      {
        title: 'Data Quality and Pipeline Monitoring',
        content: aiLessonContent.lesson3
      }
    ];
    
    for (let i = 0; i < Math.min(lessonUpdates.length, existingLessons.length); i++) {
      const lesson = existingLessons[i];
      const update = lessonUpdates[i];
      
      await db
        .update(lessons)
        .set({
          content: update.content,
          updatedAt: new Date()
        })
        .where(eq(lessons.id, lesson.id));
      
      console.log(`✅ Updated lesson: ${lesson.title}`);
    }
    
    console.log('🎉 Successfully populated AI Observability course content!');
    
    // Verify the updates
    const updatedLessons = await db
      .select({
        id: lessons.id,
        title: lessons.title,
        contentLength: lessons.content
      })
      .from(lessons)
      .where(eq(lessons.courseId, courseId));
    
    console.log('\n📚 Updated lessons summary:');
    updatedLessons.forEach(lesson => {
      const contentLength = lesson.contentLength ? lesson.contentLength.length : 0;
      console.log(`  - ${lesson.title}: ${contentLength} characters`);
    });
    
  } catch (error) {
    console.error('❌ Error populating AI course content:', error);
  }
  
  process.exit(0);
}

populateAICourseContent();