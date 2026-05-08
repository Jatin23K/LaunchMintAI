import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from sklearn.metrics import (
    roc_auc_score, f1_score, confusion_matrix, classification_report
)
from app.ds.classifier import generate_synthetic_data, feature_extractor, load_model, FEATURE_COLS

def run_eval():
    df = generate_synthetic_data(n_samples=2000)
    test_df = df.iloc[int(len(df) * 0.8):]
    
    X_test = test_df[FEATURE_COLS].values
    y_test = test_df['label'].values
    
    model = load_model()
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    y_pred = (y_pred_proba >= 0.5).astype(int)
    
    auc = roc_auc_score(y_test, y_pred_proba)
    f1 = f1_score(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred)
    
    print(f"AUC-ROC: {auc:.4f}")
    print(f"F1 Score: {f1:.4f}")
    print(f"\nConfusion Matrix:\n{cm}")
    print(f"\nClassification Report:\n{classification_report(y_test, y_pred)}")
    
    fig, ax = plt.subplots(figsize=(6, 5))
    im = ax.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    plt.colorbar(im, ax=ax)
    ax.set(xticks=[0, 1], yticks=[0, 1],
           xticklabels=['Failed', 'Survived'],
           yticklabels=['Failed', 'Survived'],
           ylabel='True Label', xlabel='Predicted Label',
           title='Confusion Matrix — Startup Survival Classifier')
    for i in range(2):
        for j in range(2):
            ax.text(j, i, str(cm[i, j]), ha='center', va='center',
                    color='white' if cm[i, j] > cm.max() / 2 else 'black', fontsize=14)
    plt.tight_layout()
    out_path = os.path.join(os.path.dirname(__file__), 'models', 'confusion_matrix.png')
    plt.savefig(out_path)
    print(f"\nConfusion matrix saved to: {out_path}")

if __name__ == '__main__':
    run_eval()
