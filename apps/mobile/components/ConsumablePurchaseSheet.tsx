import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useIAPStore } from '../stores/iap';
import {
  getProductsByType,
  type ConsumableProduct,
  type ConsumableType,
} from '../services/iapProducts';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
  visible: boolean;
  type: ConsumableType;
  onClose: () => void;
}

export default function ConsumablePurchaseSheet({ visible, type, onClose }: Props) {
  const { purchaseConsumable, isPurchasing, purchaseError, clearError, isMock } = useIAPStore();
  const products = getProductsByType(type);
  const [selectedProduct, setSelectedProduct] = useState<ConsumableProduct>(products[1]); // middle tier

  const handlePurchase = useCallback(async () => {
    const success = await purchaseConsumable(selectedProduct.id, selectedProduct.quantity);
    if (success) {
      onClose();
    } else if (purchaseError) {
      clearError();
    }
  }, [selectedProduct, purchaseConsumable, purchaseError, clearError, onClose]);

  const isBoost = type === 'boost';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <MaterialCommunityIcons
              name={isBoost ? 'flash' : 'star'}
              size={28}
              color={isBoost ? '#FFD600' : '#7C4DFF'}
            />
            <Text style={styles.title}>
              {isBoost ? 'Buy Boosts' : 'Buy Super Sparks'}
            </Text>
          </View>

          {isMock && (
            <View style={styles.mockBanner}>
              <MaterialCommunityIcons name="test-tube" size={14} color="#FFD600" />
              <Text style={styles.mockBannerText}>Dev Mode</Text>
            </View>
          )}

          <Text style={styles.subtitle}>
            {isBoost
              ? 'Get 10x more profile views for 30 minutes'
              : 'Stand out from the crowd — your Super Spark notifies them instantly'}
          </Text>

          {/* Product Cards */}
          {products.map((product) => {
            const isSelected = selectedProduct.id === product.id;
            return (
              <TouchableOpacity
                key={product.id}
                style={[
                  styles.productCard,
                  isSelected && { borderColor: product.color, borderWidth: 2 },
                ]}
                onPress={() => setSelectedProduct(product)}
                activeOpacity={0.7}
              >
                <View style={styles.productLeft}>
                  <MaterialCommunityIcons
                    name={product.icon as any}
                    size={24}
                    color={product.color}
                  />
                  <View>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productDescription}>{product.description}</Text>
                  </View>
                </View>
                <View style={styles.productRight}>
                  <Text style={styles.productPrice}>{product.price}</Text>
                  {isSelected && (
                    <MaterialCommunityIcons
                      name="checkbox-marked-circle"
                      size={20}
                      color={product.color}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          {/* CTA */}
          <TouchableOpacity
            style={[
              styles.buyButton,
              { backgroundColor: isBoost ? '#FFD600' : '#7C4DFF' },
              isPurchasing && styles.buyButtonDisabled,
            ]}
            onPress={handlePurchase}
            disabled={isPurchasing}
            activeOpacity={0.8}
          >
            {isPurchasing ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buyText}>
                Buy {selectedProduct.name} — {selectedProduct.price}
              </Text>
            )}
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            {selectedProduct.quantity} {isBoost ? 'boost' : 'super spark'}
            {selectedProduct.quantity > 1 ? 's' : ''} will be added to your account immediately.
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#141414',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333',
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 8,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  mockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A00',
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
    gap: 6,
  },
  mockBannerText: { color: '#FFD600', fontSize: 12, fontWeight: '500' },
  subtitle: {
    textAlign: 'center',
    color: '#A0A0A0',
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C1C',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  productLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  productName: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  productDescription: { fontSize: 12, color: '#A0A0A0', marginTop: 2 },
  productRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  productPrice: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  buyButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  buyButtonDisabled: { opacity: 0.5 },
  buyText: { fontSize: 16, fontWeight: '700', color: '#000' },
  cancelButton: { alignItems: 'center', paddingVertical: 14 },
  cancelText: { color: '#A0A0A0', fontSize: 15 },
  disclaimer: {
    textAlign: 'center',
    color: '#555',
    fontSize: 11,
    lineHeight: 16,
  },
});
