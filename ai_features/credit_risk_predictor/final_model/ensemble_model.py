
import numpy as np

class CreditEnsembleModel:
    def __init__(self, rf_model, xgb_model, w_rf=0.6, w_xgb=0.4):
        self.rf_model = rf_model
        self.xgb_model = xgb_model
        self.w_rf = w_rf
        self.w_xgb = w_xgb

    def predict_proba(self, X):
        rf_prob = self.rf_model.predict_proba(X)[:, 1]
        xgb_prob = self.xgb_model.predict_proba(X)[:, 1]

        ensemble_prob = (self.w_rf * rf_prob) + (self.w_xgb * xgb_prob)

        return np.vstack([1 - ensemble_prob, ensemble_prob]).T

    def predict(self, X):
        prob = self.predict_proba(X)[:, 1]
        return (prob >= 0.5).astype(int)
