import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { ChevronLeft, ChevronRight, Check, Upload, Camera, X, CheckCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import type { ApplicationFormData } from '@/types/application';
import { 
  APPLICATION_PURPOSES, 
  COMPANY_TYPES, 
  CATEGORY_TAGS, 
  COUNTRIES 
} from '@/constants/applications';
import { CITIES_BY_COUNTRY } from '@/constants/countries';
import { supabase } from '@/lib/supabase';

type Step = 1 | 2 | 3 | 4 | 5 | 6;

interface UploadedFile {
  uri: string;
  name: string;
  type: string;
  size: number;
  uploaded?: boolean;
  url?: string;
}

interface DocumentUpload {
  businessLicense?: UploadedFile;
  taxCertificate?: UploadedFile;
  companyRegistration?: UploadedFile;
  bankDocument?: UploadedFile;
  addressVerification?: UploadedFile;
  additionalLicense?: UploadedFile;
}

interface IDDocuments {
  front?: UploadedFile;
  back?: UploadedFile;
  type: 'passport' | 'national_id' | 'driver_license' | '';
}

export default function ApplyScreen() {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<Partial<ApplicationFormData>>({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    country: 'TR',
    city: '',
    address: '',
    application_purpose: 'creator',
    category_tags: [],
    kvkk_accepted: false,
    privacy_accepted: false,
    terms_accepted: false,
    signature_name: '',
  });

  const [documents, setDocuments] = useState<DocumentUpload>({});
  const [idDocuments, setIDDocuments] = useState<IDDocuments>({ type: '' });
  const [selfieUri, setSelfieUri] = useState<string>('');
  const [showCamera, setShowCamera] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);

  const updateField = <K extends keyof ApplicationFormData>(
    field: K,
    value: ApplicationFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTag = (tag: string) => {
    const tags = formData.category_tags || [];
    if (tags.includes(tag)) {
      updateField('category_tags', tags.filter((t) => t !== tag));
    } else if (tags.length < 5) {
      updateField('category_tags', [...tags, tag]);
    }
  };

  const validateStep = (step: Step): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.first_name &&
          formData.last_name &&
          formData.phone &&
          formData.email &&
          formData.country &&
          formData.city &&
          formData.address
        );
      case 2:
        return true;
      case 3:
        const requiredDocs = [
          documents.businessLicense,
          documents.taxCertificate,
          documents.companyRegistration,
          documents.bankDocument,
          documents.addressVerification,
        ];
        return requiredDocs.every(doc => doc && doc.uri);
      case 4:
        return !!selfieUri;
      case 5:
        return !!(
          idDocuments.type &&
          idDocuments.front &&
          idDocuments.back
        );
      case 6:
        return !!(
          formData.kvkk_accepted &&
          formData.privacy_accepted &&
          formData.terms_accepted &&
          formData.signature_name
        );
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) {
      Alert.alert('Incomplete', 'Please fill in all required fields');
      return;
    }
    if (currentStep < 6) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const uploadFileToSupabase = async (file: UploadedFile, folder: string): Promise<string> => {
    if (!supabase) throw new Error('Supabase not initialized');

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

    const { error } = await supabase.storage
      .from('applications')
      .upload(filePath, formData);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('applications')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!validateStep(6)) {
      Alert.alert('Incomplete', 'Please accept all terms and provide your signature');
      return;
    }

    setLoading(true);
    try {
      console.log('[Apply] Uploading files...');
      
      const uploadedDocUrls: Record<string, string> = {};
      
      if (documents.businessLicense) {
        uploadedDocUrls.businessLicense = await uploadFileToSupabase(documents.businessLicense, 'documents');
      }
      if (documents.taxCertificate) {
        uploadedDocUrls.taxCertificate = await uploadFileToSupabase(documents.taxCertificate, 'documents');
      }
      if (documents.companyRegistration) {
        uploadedDocUrls.companyRegistration = await uploadFileToSupabase(documents.companyRegistration, 'documents');
      }
      if (documents.bankDocument) {
        uploadedDocUrls.bankDocument = await uploadFileToSupabase(documents.bankDocument, 'documents');
      }
      if (documents.addressVerification) {
        uploadedDocUrls.addressVerification = await uploadFileToSupabase(documents.addressVerification, 'documents');
      }
      if (documents.additionalLicense) {
        uploadedDocUrls.additionalLicense = await uploadFileToSupabase(documents.additionalLicense, 'documents');
      }

      if (selfieUri) {
        uploadedDocUrls.selfie = await uploadFileToSupabase(
          { uri: selfieUri, name: 'selfie.jpg', type: 'image/jpeg', size: 0 },
          'selfies'
        );
      }

      if (idDocuments.front) {
        uploadedDocUrls.idFront = await uploadFileToSupabase(idDocuments.front, 'id-documents');
      }
      if (idDocuments.back) {
        uploadedDocUrls.idBack = await uploadFileToSupabase(idDocuments.back, 'id-documents');
      }

      console.log('[Apply] Submitting application', formData);
      
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/applications/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          documents: uploadedDocUrls,
          idDocumentType: idDocuments.type,
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert(
          'Success',
          'Your application has been submitted successfully! We will review it within 48 hours.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('[Apply] Submit error', error);
      Alert.alert('Error', 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Personal Information</Text>
            
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.first_name}
              onChangeText={(text) => updateField('first_name', text)}
              placeholder="Enter your first name"
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.last_name}
              onChangeText={(text) => updateField('last_name', text)}
              placeholder="Enter your last name"
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>Birth Date</Text>
            <TextInput
              style={styles.input}
              value={formData.birth_date}
              onChangeText={(text) => updateField('birth_date', text)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>National ID (Optional)</Text>
            <TextInput
              style={styles.input}
              value={formData.national_id}
              onChangeText={(text) => updateField('national_id', text)}
              placeholder="Enter your national ID"
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>Phone *</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => updateField('phone', text)}
              placeholder="+90 555 123 4567"
              placeholderTextColor="#666"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              placeholder="your@email.com"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Country *</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowCountryPicker(true)}
            >
              <Text style={styles.dropdownButtonText}>
                {formData.country 
                  ? COUNTRIES.find(c => c.code === formData.country)?.name || 'Select Country'
                  : 'Select Country'}
              </Text>
              <ChevronRight color="#888" size={20} />
            </TouchableOpacity>

            <Text style={styles.label}>City *</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => {
                if (!formData.country) {
                  Alert.alert('Select Country First', 'Please select a country before choosing a city');
                  return;
                }
                setShowCityPicker(true);
              }}
            >
              <Text style={styles.dropdownButtonText}>
                {formData.city || 'Select City'}
              </Text>
              <ChevronRight color="#888" size={20} />
            </TouchableOpacity>

            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.address}
              onChangeText={(text) => updateField('address', text)}
              placeholder="Enter your full address"
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Hometown</Text>
            <TextInput
              style={styles.input}
              value={formData.hometown}
              onChangeText={(text) => updateField('hometown', text)}
              placeholder="Your hometown"
              placeholderTextColor="#666"
            />
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Company Information (Optional)</Text>
            <Text style={styles.stepSubtitle}>
              Fill this section only if you&apos;re applying as a company
            </Text>

            <Text style={styles.label}>Company Type</Text>
            <View style={styles.radioGroup}>
              {COMPANY_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.radioOption,
                    formData.company_type === type.value && styles.radioOptionActive,
                  ]}
                  onPress={() => updateField('company_type', type.value)}
                >
                  <Text
                    style={[
                      styles.radioText,
                      formData.company_type === type.value && styles.radioTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {formData.company_type && (
              <>
                <Text style={styles.label}>Company Name</Text>
                <TextInput
                  style={styles.input}
                  value={formData.company_name}
                  onChangeText={(text) => updateField('company_name', text)}
                  placeholder="Enter company name"
                  placeholderTextColor="#666"
                />

                <Text style={styles.label}>Tax Number</Text>
                <TextInput
                  style={styles.input}
                  value={formData.tax_number}
                  onChangeText={(text) => updateField('tax_number', text)}
                  placeholder="Enter tax number"
                  placeholderTextColor="#666"
                />

                <Text style={styles.label}>Company Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.company_address}
                  onChangeText={(text) => updateField('company_address', text)}
                  placeholder="Enter company address"
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={3}
                />

                <Text style={styles.label}>Website</Text>
                <TextInput
                  style={styles.input}
                  value={formData.website}
                  onChangeText={(text) => updateField('website', text)}
                  placeholder="https://yourcompany.com"
                  placeholderTextColor="#666"
                  autoCapitalize="none"
                />
              </>
            )}
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Company Documents</Text>
            <Text style={styles.stepSubtitle}>
              Upload required company documents (PDF or Images)
            </Text>

            <DocumentUploadItem
              label="Business License *"
              file={documents.businessLicense}
              onUpload={(file) => setDocuments({ ...documents, businessLicense: file })}
              onRemove={() => setDocuments({ ...documents, businessLicense: undefined })}
            />

            <DocumentUploadItem
              label="Tax Certificate *"
              file={documents.taxCertificate}
              onUpload={(file) => setDocuments({ ...documents, taxCertificate: file })}
              onRemove={() => setDocuments({ ...documents, taxCertificate: undefined })}
            />

            <DocumentUploadItem
              label="Company Registration *"
              file={documents.companyRegistration}
              onUpload={(file) => setDocuments({ ...documents, companyRegistration: file })}
              onRemove={() => setDocuments({ ...documents, companyRegistration: undefined })}
            />

            <DocumentUploadItem
              label="Bank Account Document *"
              file={documents.bankDocument}
              onUpload={(file) => setDocuments({ ...documents, bankDocument: file })}
              onRemove={() => setDocuments({ ...documents, bankDocument: undefined })}
            />

            <DocumentUploadItem
              label="Address Verification *"
              file={documents.addressVerification}
              onUpload={(file) => setDocuments({ ...documents, addressVerification: file })}
              onRemove={() => setDocuments({ ...documents, addressVerification: undefined })}
            />

            <DocumentUploadItem
              label="Additional License (Optional)"
              file={documents.additionalLicense}
              onUpload={(file) => setDocuments({ ...documents, additionalLicense: file })}
              onRemove={() => setDocuments({ ...documents, additionalLicense: undefined })}
            />
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Identity Verification</Text>
            <Text style={styles.stepSubtitle}>
              Take a selfie for face recognition
            </Text>

            <View style={styles.requirementsList}>
              <Text style={styles.requirementItem}>✅ Face clearly visible</Text>
              <Text style={styles.requirementItem}>✅ Good lighting</Text>
              <Text style={styles.requirementItem}>✅ No filters or masks</Text>
            </View>

            {selfieUri ? (
              <View style={styles.selfiePreview}>
                <Image source={{ uri: selfieUri }} style={styles.selfieImage} />
                <View style={styles.selfieActions}>
                  <TouchableOpacity
                    style={styles.retakeButton}
                    onPress={() => setSelfieUri('')}
                  >
                    <X color="#fff" size={20} />
                    <Text style={styles.retakeButtonText}>Retake</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={async () => {
                  if (!cameraPermission?.granted) {
                    const result = await requestCameraPermission();
                    if (!result.granted) {
                      Alert.alert('Permission Required', 'Camera permission is required to take a selfie');
                      return;
                    }
                  }
                  setShowCamera(true);
                }}
              >
                <Camera color="#F04F8F" size={32} />
                <Text style={styles.cameraButtonText}>Take Selfie</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>ID Document Upload</Text>
            <Text style={styles.stepSubtitle}>
              Upload your official identification document
            </Text>

            <Text style={styles.label}>Document Type *</Text>
            <View style={styles.radioGroup}>
              {[
                { value: 'passport', label: 'Passport' },
                { value: 'national_id', label: 'National ID' },
                { value: 'driver_license', label: "Driver's License" },
              ].map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.radioOption,
                    idDocuments.type === type.value && styles.radioOptionActive,
                  ]}
                  onPress={() => setIDDocuments({ ...idDocuments, type: type.value as any })}
                >
                  <Text
                    style={[
                      styles.radioText,
                      idDocuments.type === type.value && styles.radioTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <DocumentUploadItem
              label="Front Side *"
              file={idDocuments.front}
              onUpload={(file) => setIDDocuments({ ...idDocuments, front: file })}
              onRemove={() => setIDDocuments({ ...idDocuments, front: undefined })}
            />

            <DocumentUploadItem
              label="Back Side *"
              file={idDocuments.back}
              onUpload={(file) => setIDDocuments({ ...idDocuments, back: file })}
              onRemove={() => setIDDocuments({ ...idDocuments, back: undefined })}
            />

            <View style={styles.confirmationBox}>
              <Check color="#4CAF50" size={20} />
              <Text style={styles.confirmationText}>
                I confirm this is my official document
              </Text>
            </View>
          </View>
        );

      case 6:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Terms & Signature</Text>

            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => updateField('kvkk_accepted', !formData.kvkk_accepted)}
            >
              <View style={[styles.checkboxBox, formData.kvkk_accepted && styles.checkboxBoxActive]}>
                {formData.kvkk_accepted && <Check color="#fff" size={16} />}
              </View>
              <Text style={styles.checkboxText}>
                I accept the KVKK (Personal Data Protection) terms *
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => updateField('privacy_accepted', !formData.privacy_accepted)}
            >
              <View style={[styles.checkboxBox, formData.privacy_accepted && styles.checkboxBoxActive]}>
                {formData.privacy_accepted && <Check color="#fff" size={16} />}
              </View>
              <Text style={styles.checkboxText}>I accept the Privacy Policy *</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => updateField('terms_accepted', !formData.terms_accepted)}
            >
              <View style={[styles.checkboxBox, formData.terms_accepted && styles.checkboxBoxActive]}>
                {formData.terms_accepted && <Check color="#fff" size={16} />}
              </View>
              <Text style={styles.checkboxText}>I accept the Terms & Conditions *</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Digital Signature *</Text>
            <Text style={styles.helperText}>
              Type your full name to sign this application
            </Text>
            <TextInput
              style={styles.input}
              value={formData.signature_name}
              onChangeText={(text) => updateField('signature_name', text)}
              placeholder="Your Full Name"
              placeholderTextColor="#666"
            />

            {formData.signature_name && (
              <View style={styles.signaturePreview}>
                <Text style={styles.signatureText}>{formData.signature_name}</Text>
                <Text style={styles.signatureDate}>{new Date().toLocaleDateString()}</Text>
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agency/Partner Application</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.progressContainer}>
        {[1, 2, 3, 4, 5, 6].map((step) => (
          <View
            key={step}
            style={[
              styles.progressDot,
              step <= currentStep && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {renderStep()}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.secondaryButton} onPress={prevStep}>
            <ChevronLeft color="#F04F8F" size={20} />
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        {currentStep < 6 ? (
          <TouchableOpacity
            style={[styles.primaryButton, currentStep === 1 && { flex: 1 }]}
            onPress={nextStep}
          >
            <Text style={styles.primaryButtonText}>Next</Text>
            <ChevronRight color="#fff" size={20} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryButton, styles.submitButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Submitting...' : 'Submit Application'}
            </Text>
            <Check color="#fff" size={20} />
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={showCountryPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <X color="#fff" size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {COUNTRIES.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  style={styles.modalItem}
                  onPress={() => {
                    updateField('country', country.code);
                    updateField('city', '');
                    setShowCountryPicker(false);
                  }}
                >
                  <Text style={styles.modalItemText}>
                    {country.name}
                  </Text>
                  {formData.country === country.code && (
                    <Check color="#F04F8F" size={20} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showCityPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select City</Text>
              <TouchableOpacity onPress={() => setShowCityPicker(false)}>
                <X color="#fff" size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {formData.country && CITIES_BY_COUNTRY[formData.country]?.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={styles.modalItem}
                  onPress={() => {
                    updateField('city', city);
                    setShowCityPicker(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{city}</Text>
                  {formData.city === city && (
                    <Check color="#F04F8F" size={20} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showCamera} animationType="slide">
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="front"
          >
            <View style={styles.cameraOverlay}>
              <TouchableOpacity
                style={styles.cameraCloseButton}
                onPress={() => setShowCamera(false)}
              >
                <X color="#fff" size={32} />
              </TouchableOpacity>
              <View style={styles.cameraControls}>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={async () => {
                    const result = await ImagePicker.launchCameraAsync({
                      mediaTypes: ImagePicker.MediaTypeOptions.Images,
                      allowsEditing: true,
                      aspect: [1, 1],
                      quality: 0.8,
                    });
                    if (!result.canceled) {
                      setSelfieUri(result.assets[0].uri);
                      setShowCamera(false);
                    }
                  }}
                >
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        </View>
      </Modal>
    </View>
  );
}

function DocumentUploadItem({
  label,
  file,
  onUpload,
  onRemove,
}: {
  label: string;
  file?: UploadedFile;
  onUpload: (file: UploadedFile) => void;
  onRemove: () => void;
}) {
  const [uploading, setUploading] = useState(false);

  const pickDocument = async () => {
    try {
      setUploading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        onUpload({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0,
        });
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick document');
    } finally {
      setUploading(false);
    }
  };

  const takePhoto = async () => {
    try {
      setUploading(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        onUpload({
          uri: asset.uri,
          name: `photo_${Date.now()}.jpg`,
          type: 'image/jpeg',
          size: 0,
        });
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo');
    } finally {
      setUploading(false);
    }
  };

  const pickFromGallery = async () => {
    try {
      setUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        onUpload({
          uri: asset.uri,
          name: `image_${Date.now()}.jpg`,
          type: 'image/jpeg',
          size: 0,
        });
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setUploading(false);
    }
  };

  const showUploadOptions = () => {
    Alert.alert(
      'Upload Method',
      'Choose how to upload your document',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickFromGallery },
        { text: 'Upload PDF', onPress: pickDocument },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.documentUploadItem}>
      <Text style={styles.documentLabel}>{label}</Text>
      {file ? (
        <View style={styles.uploadedFile}>
          <View style={styles.uploadedFileInfo}>
            <CheckCircle color="#4CAF50" size={20} />
            <Text style={styles.uploadedFileName} numberOfLines={1}>
              {file.name}
            </Text>
          </View>
          <TouchableOpacity onPress={onRemove}>
            <X color="#F04F8F" size={20} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={showUploadOptions}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#F04F8F" />
          ) : (
            <>
              <Upload color="#888" size={20} />
              <Text style={styles.uploadButtonText}>Upload File</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  progressDot: {
    width: 40,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
  },
  progressDotActive: {
    backgroundColor: '#F04F8F',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  stepContainer: {
    gap: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#fff',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  radioGroup: {
    gap: 8,
  },
  radioOption: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
  },
  radioOptionActive: {
    borderColor: '#F04F8F',
    backgroundColor: '#2a1a2a',
  },
  radioText: {
    fontSize: 14,
    color: '#888',
  },
  radioTextActive: {
    color: '#F04F8F',
    fontWeight: '600' as const,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxActive: {
    backgroundColor: '#F04F8F',
    borderColor: '#F04F8F',
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
  },
  signaturePreview: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  signatureText: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#F04F8F',
    fontStyle: 'italic' as const,
  },
  signatureDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F04F8F',
    borderRadius: 8,
    padding: 14,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#F04F8F',
    borderRadius: 8,
    padding: 14,
    minWidth: 100,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#F04F8F',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  modalItemText: {
    fontSize: 16,
    color: '#fff',
  },
  documentUploadItem: {
    gap: 8,
  },
  documentLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: 14,
    color: '#888',
  },
  uploadedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
  },
  uploadedFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  uploadedFileName: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  requirementsList: {
    gap: 8,
    marginVertical: 16,
  },
  requirementItem: {
    fontSize: 14,
    color: '#888',
  },
  cameraButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#F04F8F',
    borderRadius: 12,
    padding: 32,
    gap: 12,
  },
  cameraButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#F04F8F',
  },
  selfiePreview: {
    gap: 12,
  },
  selfieImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
  },
  selfieActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F04F8F',
    borderRadius: 8,
    padding: 12,
    paddingHorizontal: 24,
  },
  retakeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  confirmationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1a2a1a',
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  confirmationText: {
    fontSize: 14,
    color: '#4CAF50',
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cameraCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F04F8F',
  },
});
